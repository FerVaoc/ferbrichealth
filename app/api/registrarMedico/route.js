import supabaseAdmin from '@/lib/supabaseAdmin'

export async function POST(request) {
  try {
    const formData = await request.json()

    // Creacion del usuario en Auth con email confirmado
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true  
    })

    if (authError) {
      return Response.json({ error: 'Error creando usuario en Auth: ' + authError.message }, { status: 400 })
    }

    const userId = authUser.user.id

    // Tabla usuarios
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert([{
        id: userId,
        nombre: formData.nombre,
        email: formData.email,
        rol: 'medico'
      }])

    if (usuarioError) {
      return Response.json({ error: 'Error insertando en usuarios: ' + usuarioError.message }, { status: 400 })
    }

    // Tabla medicos
    const { error: medicoError } = await supabaseAdmin
      .from('medicos')
      .insert([{
        id: userId,
        especialidad: formData.especialidad,
        nombre: formData.nombre,
        sexo: formData.sexo || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        cedula_profesional: formData.cedula_profesional || null,
        fecha_ingreso: formData.fecha_ingreso || null,
        email: formData.email
      }])

    if (medicoError) {
      return Response.json({ error: 'Error insertando en medicos: ' + medicoError.message }, { status: 400 })
    }

    return Response.json({ message: 'Médico registrado correctamente ✅' }, { status: 200 })

  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Error inesperado' }, { status: 500 })
  }
}
