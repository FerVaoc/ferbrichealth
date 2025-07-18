'use client'

import Header from '@/components/Header'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NuevaCitaPage() {
  const [medicos, setMedicos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [asistentes, setAsistentes] = useState([])
  const [form, setForm] = useState({
    medico_id: '',
    paciente_id: '',
    asistente_id: '',
    fecha_hora: '',
    tipo: '',
    estado: '',
    motivo: '',
    notas_generales: ''
  })

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) return

      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .single()
      
      if (usuarioError || !usuario) return

      let medicoId = null

      if (usuario.rol === 'medico') {
        medicoId = userId
        setMedicos([{ id: userId, nombre: 'Tú mismo' }])
      } else if (usuario.rol === 'asistente') {
        const { data: asistenteData } = await supabase
          .from('asistentes')
          .select('medico_id')
          .eq('id', userId)
          .single()

        medicoId = asistenteData?.medico_id

        if (medicoId) {
          const { data: medicoData } = await supabase
            .from('medicos')
            .select('id, nombre, sexo')
            .eq('id', medicoId)
            .single()

          setMedicos([{ id: medicoData?.id, nombre: medicoData?.nombre || 'Médico' }])
        }
      } else if (usuario.rol === 'admin') {
        const { data: todosMedicos } = await supabase
          .from('medicos')
          .select('id, nombre, sexo')

        setMedicos(todosMedicos || [])
      }

      if (medicoId) {
        const { data: asistentesData } = await supabase
          .from('asistentes')
          .select('id, nombre')
          .eq('medico_id', medicoId)

        setAsistentes(asistentesData || [])
      } else {
        const { data: todosAsistentes } = await supabase
          .from('asistentes')
          .select('id, nombre')

        setAsistentes(todosAsistentes || [])
      }

      let pacientesQuery = supabase
        .from('pacientes')
        .select('id, nombre, apellido_paterno, apellido_materno')

      if (usuario.rol !== 'admin' && medicoId) {
        pacientesQuery = pacientesQuery.eq('medico_id', medicoId)
      }

      const { data: pacientesData } = await pacientesQuery

      const pacientesFormateados = pacientesData?.map(p => ({
        id: p.id,
        nombre: `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno}`.trim()
      })) || []

      setPacientes(pacientesFormateados)
    }

    cargarDatos()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { error } = await supabase
      .from('citas')
      .insert([{
        medico_id: form.medico_id,
        paciente_id: form.paciente_id,
        asistente_id: form.asistente_id || null,
        fecha_hora: form.fecha_hora,
        tipo: form.tipo,
        estado: form.estado,
        motivo: form.motivo,
        notas_generales: form.notas_generales
      }])

    if (error) {
      console.error('Error al registrar la cita:', error)
      alert('Ocurrió un error al registrar la cita. Intenta nuevamente.')
      return
    }

    //Busca el token de notificación del medico en la tabla
    const { data: tokenData, error: tokenError } = await supabase
      .from('tokens_notificaciones')
      .select('token')
      .eq('usuario_id', form.medico_id)
      .single()

    if (tokenError || !tokenData?.token) {
      console.warn('No se encontró el token de notificación del médico.')
    } else {
      // Enviar notificacion
      await fetch('/api/enviarNotificacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: tokenData.token,
          title: '📅 Nueva cita registrada',
          body: 'Tienes una nueva cita médica agendada. Revisa tu agenda.'
        })
      })
    }
    alert('✅ Cita registrada correctamente.')
    router.push('/admin/agenda')
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white p-6 pt-24">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-[#003f74]">Registrar Nueva Cita</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Médico</label>
              <select name="medico_id" value={form.medico_id} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800">
                <option value="">Selecciona un médico</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {(m.sexo === 'femenino' ? 'Dra.' : 'Dr.')} {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Paciente</label>
              <select name="paciente_id" value={form.paciente_id} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800">
                <option value="">Selecciona un paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Asistente</label>
              <select name="asistente_id" value={form.asistente_id} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800">
                <option value="">Ninguno</option>
                {asistentes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Fecha y Hora</label>
              <input type="datetime-local" name="fecha_hora" value={form.fecha_hora} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Tipo</label>
              <select name="tipo" value={form.tipo} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800">
                <option value="">Selecciona el tipo</option>
                <option value="consulta">Consulta</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="chequeo">Chequeo</option>
                <option value="urgencia">Urgencia</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Estado</label>
              <select name="estado" value={form.estado} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800">
                <option value="">Selecciona el estado</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Motivo</label>
              <textarea name="motivo" value={form.motivo} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800"></textarea>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Notas Generales</label>
              <textarea name="notas_generales" value={form.notas_generales} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800"></textarea>
            </div>

            <button type="submit" className="w-full p-3 bg-gradient-to-r from-[#003f74] to-[#006bb3] text-white font-semibold rounded-xl shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
              Registrar Cita
            </button>
          </form>
        </div>
      </div>
    </>
  )
}