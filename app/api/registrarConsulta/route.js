import supabaseAdmin from '@/lib/supabaseAdmin'

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('🔍 Body recibido:', body)

    if (!body.paciente_id || !body.medico_id) {
      return Response.json({ error: 'Faltan datos obligatorios: paciente_id o medico_id.' }, { status: 400 })
    }

    // Insertar en consultas
    const fecha = body.fecha || new Date().toISOString()

    const { data: consulta, error: errorConsulta } = await supabaseAdmin
      .from('consultas')
      .insert([{
        paciente_id: body.paciente_id,
        medico_id: body.medico_id,
        fecha,
        motivo: body.motivo,
        diagnostico: body.diagnostico,
        tratamiento: body.tratamiento,
        notas: body.notas || null,
      }])
      .select()
      .single()

    if (errorConsulta) {
      console.error('❌ Error en consulta:', errorConsulta)
      return Response.json({ error: 'Error guardando consulta: ' + errorConsulta.message }, { status: 400 })
    }

    const consulta_id = consulta.id
    console.log('✅ Consulta guardada con ID:', consulta_id)

    // Receta (opcional)
    if (body.medicamento) {
      const { error: errorReceta } = await supabaseAdmin.from('recetas').insert([{
        consulta_id,
        paciente_id: body.paciente_id,
        medico_id: body.medico_id,
        fecha: fecha,
        medicamento: body.medicamento,
        dosis: body.dosis || null,
        frecuencia: body.frecuencia || null,
        duracion: body.duracion || null,
        indicaciones: body.indicaciones || null
      }])

      if (errorReceta) {
        console.error('❌ Error en receta:', errorReceta)
        return Response.json({ error: 'Error guardando receta: ' + errorReceta.message }, { status: 400 })
      }
    }

    // Análisis (opcional)
    if (body.tipo) {
      const { error: errorAnalisis } = await supabaseAdmin.from('analisis').insert([{
        paciente_id: body.paciente_id,
        medico_id: body.medico_id,
        fecha: fecha,
        tipo: body.tipo,
        resultados: body.resultados || null,
        observaciones: body.observaciones || null
      }])

      if (errorAnalisis) {
        console.error('❌ Error en análisis:', errorAnalisis)
        return Response.json({ error: 'Error guardando análisis: ' + errorAnalisis.message }, { status: 400 })
      }
    }

    return Response.json({ message: 'Consulta registrada correctamente ✅' }, { status: 200 })

  } catch (err) {
    console.error('🔥 Error general del servidor:', err)
    return Response.json({ error: 'Error inesperado del servidor' }, { status: 500 })
  }
}
