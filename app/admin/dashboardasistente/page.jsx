'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import {
  Users, Calendar, Clock, UserPlus, Activity, FileText, User, Pill, FolderOpen
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const AvatarFallback = ({ children, className = '' }) => (
  <div className={`flex items-center justify-center rounded-full font-medium text-sm ${className}`}>{children}</div>
)

const Badge = ({ className = '', children }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>
)

export default function DashboardAsistente() {
  const [user, setUser] = useState(null)
  const [rol, setRol] = useState(null)
  const [resumenData, setResumenData] = useState({ registrados: 0, agendadas: 0, proximaCita: null, signos: 0 })
  const [citas, setCitas] = useState([])
  const [signosRecientes, setSignosRecientes] = useState([])

  const [mostrarModalSignos, setMostrarModalSignos] = useState(false)
  const [pacienteSignos, setPacienteSignos] = useState(null)
  const [pacientes, setPacientes] = useState([])

  const [busquedaSignos, setBusquedaSignos] = useState('')

  const router = useRouter()

  //Signos
  useEffect(() => {
    if (pacienteSignos) {
      router.push(`/admin/signos?pacienteId=${pacienteSignos.id}`)
      setPacienteSignos(null)
    }
  }, [pacienteSignos])

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth?.user?.id
      setUser(auth?.user)

      // Verificamos que sea asistente
      const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', userId).single()
      if (usuario?.rol !== 'asistente') return setRol('denegado')
      setRol('asistente')

      // Obtener el medico_id del asistente
      const { data: asistente } = await supabase.from('asistentes').select('medico_id').eq('id', userId).single()
      const medico_id = asistente?.medico_id

      await obtenerResumen(medico_id)
      await obtenerCitas(medico_id)
      await obtenerSignos(medico_id)
      await obtenerPacientes(medico_id)
    }

    const obtenerPacientes = async (medico_id) => {
      const { data } = await supabase
        .from('pacientes')
        .select('id, nombre, apellido_paterno, apellido_materno, telefono, fecha_nacimiento')
        .eq('medico_id', medico_id)
        .order('nombre', { ascending: true })

      setPacientes(data || [])
    }

    const obtenerResumen = async (medico_id) => {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const inicio = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString()
      const ahora = new Date(Date.now() - hoy.getTimezoneOffset() * 60000).toISOString()

      // Pacientes del medico actual registrados hoy
      const { count: registrados } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('medico_id', medico_id)
        .gte('fecha_registro', inicio)

      // Citas del medico actual agendadas hoy
      const { count: agendadas } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .eq('medico_id', medico_id)
        .gte('fecha_hora', inicio)

      // Proxima cita del médico
      const { data: proxima } = await supabase
        .from('citas')
        .select('fecha_hora, tipo, pacientes:paciente_id (nombre, apellido_paterno)')
        .eq('medico_id', medico_id)
        .gt('fecha_hora', ahora)
        .order('fecha_hora', { ascending: true })
        .limit(1)

      // Signos vitales registrados hoy por pacientes del médico actual
      const { data: signosData } = await supabase
        .from('signos_vitales')
        .select('id, fecha, paciente_id, pacientes:paciente_id (medico_id)')
        .gte('fecha', inicio)

      const signos = signosData?.filter(s => s.pacientes?.medico_id === medico_id).length || 0

      const proximaCita = proxima?.[0]
        ? {
            hora: new Date(proxima[0].fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nombre: `${proxima[0].pacientes?.nombre ?? ''} ${proxima[0].pacientes?.apellido_paterno ?? ''}`,
            tipo: proxima[0].tipo
          }
        : null

      setResumenData({ registrados, agendadas, proximaCita, signos })
    }

    const obtenerCitas = async (medico_id) => {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const inicio = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString()

      const { data } = await supabase
        .from('citas')
        .select('id, fecha_hora, tipo, pacientes:paciente_id (nombre, apellido_paterno, apellido_materno)')
        .eq('medico_id', medico_id)
        .gte('fecha_hora', inicio)
        .order('fecha_hora', { ascending: false })
        .limit(5)

      const formateadas = data?.map(c => ({
        id: c.id,
        nombre: `${c.pacientes?.nombre} ${c.pacientes?.apellido_paterno} ${c.pacientes?.apellido_materno ?? ''}`,
        hora: new Date(c.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: c.tipo,
        avatar: `${c.pacientes?.nombre?.[0] ?? 'P'}${c.pacientes?.apellido_paterno?.[0] ?? ''}`.toUpperCase()
      })) || []

      setCitas(formateadas)
    }

    const obtenerSignos = async (medico_id) => {
      const { data } = await supabase
        .from('signos_vitales')
        .select(`
          id,
          fecha,
          pacientes:paciente_id (
            nombre,
            apellido_paterno,
            medico_id
          )
        `)
        .order('fecha', { ascending: false })
        .limit(5)

      const filtrados = data?.filter(s => s.pacientes?.medico_id === medico_id) || []
      setSignosRecientes(filtrados)
    }

    obtenerDatos()
  }, [])

  if (rol === 'denegado') return <div className="p-20 text-center text-gray-600 text-lg">Acceso restringido. Vista exclusiva para asistentes.</div>

  const resumen = [
    { title: 'Pacientes Registrados Hoy', value: resumenData.registrados, icon: Users, color: 'bg-blue-700' },
    { title: 'Citas Agendadas', value: resumenData.agendadas, icon: Calendar, color: 'bg-blue-500' },
    {
      title: 'Próxima Cita',
      value: resumenData.proximaCita?.hora || '—',
      subtitle: resumenData.proximaCita ? `${resumenData.proximaCita.nombre} (${resumenData.proximaCita.tipo})` : '',
      icon: Clock,
      color: 'bg-yellow-500'
    },
    { title: 'Signos Vitales Registrados', value: resumenData.signos, icon: Activity, color: 'bg-purple-600' }
  ]

  const acciones = [
    { title: 'Registrar Cita', href: 'agenda/nuevacita', icon: Calendar, color: 'bg-gradient-to-r from-blue-500 to-blue-700' },
    { title: 'Nuevo Paciente', href: '/admin/registropaciente', icon: UserPlus, color: 'bg-gradient-to-r from-green-400 to-green-600' },
    { title: 'Ver Agenda', href: '/admin/agenda', icon: FolderOpen, color: 'bg-gradient-to-r from-indigo-400 to-indigo-600' },
    { title: 'Capturar Signos', icon: Pill, color: 'bg-gradient-to-r from-red-400 to-red-600', onClick: () => setMostrarModalSignos(true)}
  ]

  //Busqueda
  const pacientesFiltradosSignos = pacientes.filter(p =>
    `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno ?? ''}`.toLowerCase().includes(busquedaSignos.toLowerCase())
  )

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white p-6 pt-28">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-900">Dashboard del Asistente</h1>
            <p className="text-gray-500">Resumen y gestión diaria asistente</p>
          </div>

          <section className="space-y-12">
            {/* Resumen del Día */}
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Resumen del Día</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {resumen.map((item, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl shadow hover:shadow-md transition">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500 font-medium">{item.title}</p>
                      <div className={`p-2 rounded-full ${item.color}`}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{item.value}</p>
                    {item.subtitle && <p className="text-sm text-gray-500 font-medium">{item.subtitle}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos Rápidos */}
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Accesos Rápidos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {acciones.map((a, idx) => {
                  const content = (
                    <div className={`rounded-full px-4 py-4 font-medium shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer text-white flex flex-col items-center ${a.color}`}>
                      <a.icon className="h-6 w-6 mb-1" />
                      <span className="text-sm font-semibold">{a.title}</span>
                    </div>
                  )

                  return a.onClick ? (
                    <button key={idx} onClick={a.onClick} className="appearance-none border-none bg-transparent p-0 m-0">
                      {content}
                    </button>
                  ) : (
                    <Link key={idx} href={a.href}>
                      {content}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Actividad Reciente */}
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-4">Actividad Reciente</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-600">
                    <Calendar className="h-5 w-5" /> Últimas Citas
                  </h3>
                  {citas.map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-gray-50 p-3 rounded hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <AvatarFallback className="bg-blue-700 text-white w-10 h-10">{c.avatar}</AvatarFallback>
                        <div>
                          <p className="font-medium text-gray-800">{c.nombre}</p>
                          <p className="text-sm text-gray-500">{c.tipo}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-500 flex items-center justify-end gap-1">
                          <Clock className="w-4 h-4" /> {c.hora}
                        </p>
                        <Badge className="bg-green-100 text-green-700 mt-1">Registrada</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-red-600">
                    <Activity className="h-5 w-5" /> Signos Vitales Recientes
                  </h3>
                  {signosRecientes.map((s) => (
                    <div key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <AvatarFallback className="bg-green-600 text-white w-10 h-10">SV</AvatarFallback>
                        <div>
                          <p className="font-medium text-gray-800">
                            {s.pacientes?.nombre} {s.pacientes?.apellido_paterno}
                          </p>
                          <p className="text-sm text-gray-500">{new Date(s.fecha).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge className="border border-gray-300 text-gray-600">Nuevo</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

        {/* Modal de captura de signos */}
        {mostrarModalSignos && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto relative p-6">
              <button
                onClick={() => setMostrarModalSignos(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 font-bold text-xl cursor-pointer"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-[#003f74] mb-4">Selecciona un paciente para capturar signos</h2>

              {pacientes.length === 0 ? (
                <p className="text-gray-500">No hay pacientes registrados.</p>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    value={busquedaSignos}
                    onChange={(e) => setBusquedaSignos(e.target.value)}
                    className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {pacientesFiltradosSignos.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setPacienteSignos(p)
                          setMostrarModalSignos(false)
                        }}
                        className="p-3 rounded hover:bg-teal-50 border border-gray-200 cursor-pointer transition"
                      >
                        <p className="font-medium text-gray-800">{p.nombre} {p.apellido_paterno} {p.apellido_materno ?? ''}</p>
                        <p className="text-sm text-gray-500">{p.telefono || 'Sin teléfono'} — {p.fecha_nacimiento}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </>
  )
}