import supabaseAdmin from '@/lib/supabaseAdmin'

export async function POST(request) {
  try {
    const { paciente_id } = await request.json()

    if (!paciente_id) {
      return Response.json({ error: 'Falta el ID del paciente.' }, { status: 400 })
    }

    // Consultas
    const { data: consultas } = await supabaseAdmin
      .from('consultas')
      .select('*')
      .eq('paciente_id', paciente_id)
      .order('fecha', { ascending: false })

    // Recetas
    const { data: recetas } = await supabaseAdmin
      .from('recetas')
      .select('*')
      .eq('paciente_id', paciente_id)
      .order('fecha', { ascending: false })

    // Análisis
    const { data: analisis } = await supabaseAdmin
      .from('analisis')
      .select('*')
      .eq('paciente_id', paciente_id)
      .order('fecha', { ascending: false })

    // Signos vitales
    const { data: signos } = await supabaseAdmin
      .from('signos_vitales')
      .select('*')
      .eq('paciente_id', paciente_id)
      .order('fecha', { ascending: false })

    return Response.json({
      consultas: consultas || [],
      recetas: recetas || [],
      analisis: analisis || [],
      signos: signos || []
    })
  } catch (error) {
    console.error('Error cargando historial del paciente:', error)
    return Response.json({ error: 'Error cargando historial del paciente.' }, { status: 500 })
  }
}
