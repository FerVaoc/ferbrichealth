import supabaseAdmin from '@/lib/supabaseAdmin'

export async function POST(request) {
  try {
    const formData = await request.json()

    if (!formData.nombre || !formData.apellido_paterno || !formData.apellido_materno || !formData.fecha_nacimiento || !formData.sexo) {
      return Response.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('pacientes')
      .insert([{
        medico_id: formData.medico_id || null,
        nombre: formData.nombre,
        apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno,
        fecha_nacimiento: formData.fecha_nacimiento,
        sexo: formData.sexo,
        telefono: formData.telefono || null,
        fecha_registro: new Date().toISOString()
      }])

    if (error) {
      return Response.json({ error: 'Error al registrar paciente: ' + error.message }, { status: 400 })
    }

    return Response.json({ message: 'Paciente registrado correctamente ✅' }, { status: 200 })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error inesperado' }, { status: 500 })
  }
}
