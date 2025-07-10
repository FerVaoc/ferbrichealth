'use client'

import Header from '@/components/Header'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AgendaPage() {
  const [citas, setCitas] = useState([])
  const [estadisticas, setEstadisticas] = useState({ total: 0, confirmada: 0, pendiente: 0, encurso: 0, cancelada: 0 })
  const [proximas, setProximas] = useState([])
  const [fecha, setFecha] = useState(new Date())
  const [busqueda, setBusqueda] = useState('')
  const [modalCita, setModalCita] = useState(null)

  useEffect(() => {
  const cargarCitas = async () => {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id
    if (!userId) return

    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', userId)
      .single()

    if (usuarioError || !usuario) return

    let filtroMedicoId = null

    if (usuario.rol === 'medico') {
      filtroMedicoId = userId
    } else if (usuario.rol === 'asistente') {
      const { data: asistente, error: asistenteError } = await supabase
        .from('asistentes')
        .select('medico_id')
        .eq('id', userId)
        .single()
      if (asistenteError || !asistente) return
      filtroMedicoId = asistente.medico_id
    }

    const inicioDia = new Date(fecha)
    inicioDia.setHours(0, 0, 0, 0)

    const finDia = new Date(fecha)
    finDia.setHours(23, 59, 59, 999)

    // Zona horaria corregida (UTC a local)
    const inicioISO = new Date(inicioDia.getTime() - inicioDia.getTimezoneOffset() * 60000).toISOString()
    const finISO = new Date(finDia.getTime() - finDia.getTimezoneOffset() * 60000).toISOString()

    let query = supabase
      .from('citas')
      .select(`
        id, fecha_hora, tipo, estado, motivo, notas_generales,
        pacientes:paciente_id (nombre, apellido_paterno, apellido_materno),
        medicos:medico_id (nombre, sexo)
      `)
      .gte('fecha_hora', inicioISO)
      .lte('fecha_hora', finISO)
      .order('fecha_hora', { ascending: true })

    if (filtroMedicoId) {
      query = query.eq('medico_id', filtroMedicoId)
    }

    const { data: citasData, error } = await query

    if (error) {
      console.error('Error al obtener citas:', error)
      return
    }

    const ahora = new Date()

    const formateadas = citasData.map(c => {
      const localDate = new Date(c.fecha_hora)

      return {
        ...c,
        hora: localDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        fecha: localDate.toLocaleDateString('es-MX'),
        paciente: `${c.pacientes?.nombre || ''} ${c.pacientes?.apellido_paterno || ''} ${c.pacientes?.apellido_materno || ''}`.trim(),
        medico: `${c.medicos?.sexo === 'femenino' ? 'Dra.' : 'Dr.'} ${c.medicos?.nombre || ''}`,
        fecha_obj: localDate
      }
    })

    const resumen = {
      total: formateadas.length,
      confirmada: formateadas.filter(c => c.estado === 'confirmada').length,
      pendiente: formateadas.filter(c => c.estado === 'pendiente').length,
      cancelada: formateadas.filter(c => c.estado === 'cancelada').length
    }

    const proximas = formateadas
      .filter(c => c.fecha_obj > ahora)
      .sort((a, b) => a.fecha_obj - b.fecha_obj)
      .slice(0, 3)

    setCitas(formateadas)
    setEstadisticas(resumen)
    setProximas(proximas)
  }

  cargarCitas()
}, [fecha])

  const actualizarEstado = async (idCita, nuevoEstado) => {
    const { error } = await supabase.from('citas').update({ estado: nuevoEstado }).eq('id', idCita)
    if (!error) {
      setCitas(prev => prev.map(c => c.id === idCita ? { ...c, estado: nuevoEstado } : c))
      setEstadisticas(prev => {
        const nuevo = { ...prev }
        nuevo[citas.find(c => c.id === idCita).estado]--
        nuevo[nuevoEstado]++
        return { ...nuevo, total: prev.total }
      })
    } else {
      console.error('Error al actualizar estado:', error)
    }
  }

  const cambiarDia = (dias) => {
    const nuevaFecha = new Date(fecha)
    nuevaFecha.setDate(nuevaFecha.getDate() + dias)
    setFecha(nuevaFecha)
  }

  return (
  <>
    <Header />

    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#003f74]">Agenda de Citas</h1>
          <p className="text-gray-500">Gestiona las citas médicas del día</p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => cambiarDia(-1)} className="w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-lg shadow hover:bg-indigo-600 hover:text-white transition">
              ‹
            </button>
            <div className="font-semibold text-xl text-[#003f74]">
              {fecha.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <button onClick={() => cambiarDia(1)} className="w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-lg shadow hover:bg-indigo-600 hover:text-white transition">
              ›
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/admin/agenda/nuevacita">
              <button className="p-3 bg-gradient-to-r from-[#003f74] to-[#006bb3] text-white rounded-xl font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
                + Nueva Cita
              </button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3 bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-[#003f74]">Citas del Día</h3>

            <input
              type="text"
              placeholder="Buscar por paciente, tipo o estado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="mb-4 w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800"
            />

            <div className="space-y-4">
              {citas.filter(cita =>
                cita.paciente.toLowerCase().includes(busqueda.toLowerCase()) ||
                cita.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
                cita.estado.toLowerCase().includes(busqueda.toLowerCase())
              ).length > 0 ? citas.filter(cita =>
                cita.paciente.toLowerCase().includes(busqueda.toLowerCase()) ||
                cita.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
                cita.estado.toLowerCase().includes(busqueda.toLowerCase())
              ).map(cita => (
                <div
                  key={cita.id}
                  onClick={() => setModalCita(cita)}
                  className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-100 transition"
                >
                  <div>
                    <div className="font-bold text-gray-800">{cita.hora} - {cita.paciente}</div>
                    <div className="text-sm text-gray-500">{cita.medico}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end lg:justify-start">
                    <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">{cita.tipo}</span>
                    {['confirmada', 'pendiente', 'cancelada'].map(estado => (
                      <button
                        key={estado}
                        onClick={(e) => {
                          e.stopPropagation()
                          actualizarEstado(cita.id, estado)
                        }}
                        className={`text-white text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer
                          ${cita.estado === estado ? 'opacity-100' : 'opacity-50'}
                          ${estado === 'confirmada' ? 'bg-emerald-500' :
                            estado === 'pendiente' ? 'bg-yellow-500' :
                            'bg-red-500'}`}
                      >
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )) : (
                <p className="text-gray-500">No hay citas programadas para hoy.</p>
              )}
            </div>
          </div>

          <div className="w-full lg:w-1/3 bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-[#003f74]">Estadísticas del Día</h3>
            <ul className="mb-6 text-gray-700 space-y-2">
              <li>Total de citas: <strong>{estadisticas.total}</strong></li>
              <li>Confirmadas: <span className="text-emerald-500 font-semibold">{estadisticas.confirmada}</span></li>
              <li>Pendientes: <span className="text-yellow-500 font-semibold">{estadisticas.pendiente}</span></li>
              <li>Canceladas: <span className="text-red-500 font-semibold">{estadisticas.cancelada}</span></li>
            </ul>

            <hr className="my-4" />

            <h3 className="text-xl font-semibold mb-4 text-[#003f74]">Próximas Citas</h3>
            <ul className="text-gray-700 space-y-2">
              {proximas.length > 0 ? proximas.map((prox, index) => (
                <li key={index}>{prox.hora} - {prox.paciente} ({prox.tipo})</li>
              )) : (
                <li>No hay próximas citas.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Modal de Detalle de Cita */}
      {modalCita && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-11/12 sm:w-full max-w-md p-6 rounded-xl shadow-xl relative text-gray-900">
            <button
              onClick={() => setModalCita(null)}
              className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-lg font-bold cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4 text-[#003f74]">Detalles de la Cita</h2>
            <p><span className="font-semibold">Paciente:</span> {modalCita.paciente}</p>
            <p><span className="font-semibold">Médico:</span> {modalCita.medico}</p>
            <p><span className="font-semibold">Hora:</span> {modalCita.hora}</p>
            <p><span className="font-semibold">Fecha:</span> {modalCita.fecha}</p>
            <p><span className="font-semibold">Tipo:</span> {modalCita.tipo}</p>
            <p><span className="font-semibold">Estado:</span> {modalCita.estado}</p>
            <p className="mt-2"><span className="font-semibold">Motivo:</span> {modalCita.motivo || '—'}</p>
            <p><span className="font-semibold">Notas:</span> {modalCita.notas_generales || '—'}</p>
          </div>
        </div>
      )}
    </>
  )
}