import supabaseAdmin from '@/lib/supabaseAdmin'

export async function POST(request) {
  try {
    const formData = await request.json()

    if (!formData.medico_id) {
      return Response.json({ error: 'Falta el ID del médico que registra al asistente.' }, { status: 400 })
    }

    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true
    })

    if (authError) {
      return Response.json({ error: 'Error creando usuario en Auth: ' + authError.message }, { status: 400 })
    }

    const userId = authUser.user.id

    // Insertar en tabla usuarios
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert([{
        id: userId,
        nombre: formData.nombre,
        email: formData.email,
        rol: 'asistente'
      }])

    if (usuarioError) {
      return Response.json({ error: 'Error insertando en usuarios: ' + usuarioError.message }, { status: 400 })
    }

    // Insertar en tabla asistentes (sin contraseña)
    const { error: asistenteError } = await supabaseAdmin
      .from('asistentes')
      .insert([{
        id: userId,
        nombre: formData.nombre,
        sexo: formData.sexo || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        cargo: formData.cargo || null,
        fecha_ingreso: formData.fecha_ingreso || null,
        medico_id: formData.medico_id,
        email: formData.email
      }])

    if (asistenteError) {
      return Response.json({ error: 'Error insertando en asistentes: ' + asistenteError.message }, { status: 400 })
    }

    return Response.json({ message: 'Asistente registrado correctamente ✅' }, { status: 200 })

  } catch (err) {
    console.error('🔥 Error inesperado:', err)
    return Response.json({ error: 'Error inesperado del servidor' }, { status: 500 })
  }
}
