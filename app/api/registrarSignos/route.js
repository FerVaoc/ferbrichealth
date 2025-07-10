import supabaseAdmin from '@/lib/supabaseAdmin'

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('🩺 Body recibido (signos):', body)

    if (!body.paciente_id || !body.asistente_id) {
      return Response.json({ error: 'Faltan datos obligatorios: paciente_id o asistente_id.' }, { status: 400 })
    }

    const fecha = body.fecha || new Date().toISOString()

    const { error: errorSignos } = await supabaseAdmin.from('signos_vitales').insert([{
      paciente_id: body.paciente_id,
      peso: body.peso || null,
      estatura: body.estatura || null,
      imc: body.imc || null,
      presion_arterial: body.presion_arterial || null,
      temperatura: body.temperatura || null,
      frecuencia_cardiaca: body.frecuencia_cardiaca || null,
      frecuencia_respiratoria: body.frecuencia_respiratoria || null,
      perimetro_abdominal: body.perimetro_abdominal || null,
      glucosa: body.glucosa || null,
      fecha: fecha,
    }])

    if (errorSignos) {
      console.error('❌ Error guardando signos:', errorSignos)
      return Response.json({ error: 'Error guardando signos vitales: ' + errorSignos.message }, { status: 400 })
    }

    return Response.json({ message: 'Signos vitales registrados correctamente ✅' }, { status: 200 })

  } catch (err) {
    console.error('🔥 Error general del servidor (signos):', err)
    return Response.json({ error: 'Error inesperado del servidor' }, { status: 500 })
  }
}
