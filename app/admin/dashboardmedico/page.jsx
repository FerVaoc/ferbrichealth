'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import {
  Users, Calendar, Clock, UserPlus, Activity, FileText, User, Pill, FolderOpen, Stethoscope
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

//implementacion de push con firebase
import { firebaseApp } from '@/lib/firebase'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const AvatarFallback = ({ children, className = '' }) => (
  <div className={`flex items-center justify-center rounded-full font-medium text-sm ${className}`}>{children}</div>
)

const Badge = ({ className = '', children }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>{children}</span>
)

export default function DashboardMedico() {
  const [user, setUser] = useState(null)
  const [rol, setRol] = useState(null)
  const [resumenData, setResumenData] = useState({ atendidos: 0, agendadas: 0, proximaCita: null, urgencias: 0 })
  const [consultas, setConsultas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [mostrarModalPacientes, setMostrarModalPacientes] = useState(false)
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false)
  const [pacienteParaHistorial, setPacienteParaHistorial] = useState(null)

  const [busquedaConsulta, setBusquedaConsulta] = useState('')
  const [busquedaHistorial, setBusquedaHistorial] = useState('')

  const router = useRouter()

  //Consulta
  useEffect(() => {
    if (pacienteSeleccionado) {
      router.push(`/admin/consulta?pacienteId=${pacienteSeleccionado.id}`)
    }
  }, [pacienteSeleccionado])

  //Historial
  useEffect(() => {
    if (pacienteParaHistorial) {
      router.push(`/admin/paciente?pacienteId=${pacienteParaHistorial.id}`)
      setPacienteParaHistorial(null)
    }
  }, [pacienteParaHistorial])

  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth?.user?.id
      setUser(auth?.user)

      const { data: usuario } = await supabase.from('usuarios').select('rol').eq('id', userId).single()
      if (usuario) {
        setRol(usuario.rol)
        await obtenerResumen(userId)
        await obtenerConsultas(userId)
        await obtenerPacientes(userId)
      }
    }

    const obtenerResumen = async (userId) => {
      const hoy = new Date()
      const inicioLocal = new Date(hoy)
      inicioLocal.setHours(0, 0, 0, 0)
      const finLocal = new Date(hoy)
      finLocal.setHours(23, 59, 59, 999)

      const inicioDia = new Date(inicioLocal.getTime() - inicioLocal.getTimezoneOffset() * 60000).toISOString()
      const finDia = new Date(finLocal.getTime() - finLocal.getTimezoneOffset() * 60000).toISOString()

      const { count: atendidos } = await supabase.from('consultas').select('*', { count: 'exact', head: true })
        .eq('medico_id', userId).gte('fecha', inicioDia).lte('fecha', finDia)

      const { count: agendadas } = await supabase.from('citas').select('*', { count: 'exact', head: true })
        .eq('medico_id', userId).gte('fecha_hora', inicioDia).lte('fecha_hora', finDia)

      const { data: proximaCitaRaw } = await supabase.from('citas')
        .select('fecha_hora, tipo, pacientes:paciente_id (nombre, apellido_paterno)')
        .eq('medico_id', userId)
        .gt('fecha_hora', new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString())
        .order('fecha_hora', { ascending: true })
        .limit(1)

      const proximaCita = proximaCitaRaw?.[0]
        ? {
            hora: new Date(proximaCitaRaw[0].fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            nombre: `${proximaCitaRaw[0].pacientes?.nombre ?? ''} ${proximaCitaRaw[0].pacientes?.apellido_paterno ?? ''}`,
            tipo: proximaCitaRaw[0].tipo
          }
        : null

      const { count: urgencias } = await supabase.from('citas').select('*', { count: 'exact', head: true })
        .eq('medico_id', userId).eq('tipo', 'urgencia')
        .gte('fecha_hora', inicioDia).lte('fecha_hora', finDia)

      setResumenData({ atendidos, agendadas, proximaCita, urgencias })
    }

    const obtenerConsultas = async (userId) => {
      const { data, error } = await supabase
        .from('consultas')
        .select(`
          id,
          fecha,
          motivo,
          pacientes (
            nombre,
            apellido_paterno,
            apellido_materno
          )
        `)
        .eq('medico_id', userId)
        .order('fecha', { ascending: false })
        .limit(5)

      if (error || !data) {
        console.error('Error cargando consultas:', error || 'Sin datos')
        setConsultas([])
      }

      const formateadas = data.map((c) => ({
        id: c.id,
        patient: `${c.pacientes?.nombre ?? 'Paciente'} ${c.pacientes?.apellido_paterno ?? ''} ${c.pacientes?.apellido_materno ?? ''}`,
        time: c.fecha ? new Date(c.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        type: c.motivo || 'Consulta',
        avatar: `${c.pacientes?.nombre?.[0] ?? 'P'}${c.pacientes?.apellido_paterno?.[0] ?? ''}`.toUpperCase(),
        status: 'Completada'
      }))

      setConsultas(formateadas)
    }

    const obtenerPacientes = async (userId) => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, telefono, fecha_registro')
        .eq('medico_id', userId)

      if (error || !data) {
        console.error('Error cargando pacientes:', error || 'Sin datos')
        setPacientes([])
        return
      }

      const hoy = new Date()
      const formateados = data.map((p) => {
        const nacimiento = new Date(p.fecha_nacimiento)
        let edad = hoy.getFullYear() - nacimiento.getFullYear()
        const m = hoy.getMonth() - nacimiento.getMonth()
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--

        const registrado = new Date(p.fecha_registro).toLocaleDateString()

        return {
          id: p.id,
          nombre: `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno ?? ''}`,
          edad,
          telefono: p.telefono,
          registradoAt: registrado,
          avatar: `${p.nombre?.[0] ?? 'P'}${p.apellido_paterno?.[0] ?? ''}`.toUpperCase(),
        }
      })

      setPacientes(formateados)
    }

    obtenerUsuario()
  }, [])

  if (rol && rol !== 'medico') {
    return <div className="p-20 text-center text-gray-600 text-lg">Acceso restringido. Vista exclusiva para médicos.</div>
  }

  const resumen = [
    { title: 'Pacientes Atendidos', value: resumenData.atendidos, icon: Users, color: 'bg-[#003f74]'},
    { title: 'Citas Agendadas', value: resumenData.agendadas, icon: Calendar, color: 'bg-[#006bb3]'},
    {
      title: 'Próxima Cita',
      value: resumenData.proximaCita?.hora || '—',
      subtitle: resumenData.proximaCita
        ? `${resumenData.proximaCita.nombre} (${resumenData.proximaCita.tipo})`
        : '',
      icon: Clock,
      color: 'bg-yellow-500',
      change: resumenData.proximaCita ? 'Próximamente' : ''
    },
    { title: 'Consultas Urgentes', value: resumenData.urgencias, icon: Activity, color: 'bg-purple-600'}
  ]

  const acciones = [
    { title: 'Nueva Consulta', icon: Stethoscope, color: 'bg-gradient-to-r from-[#003f74] to-[#006bb3]', onClick: () => setMostrarModalPacientes(true) },
    { title: 'Nuevo Paciente', href: '/admin/registropaciente', icon: UserPlus, color: 'bg-gradient-to-r from-green-400 to-green-600' },
    { title: 'Ver Historial', icon: FolderOpen, color: 'bg-gradient-to-r from-yellow-400 to-yellow-500', onClick: () => {
      setMostrarModalHistorial(true)
    } },

    { title: 'Agenda', href: '/admin/agenda', icon: Calendar, color: 'bg-gradient-to-r from-purple-500 to-purple-700' },
    { title: 'Prescripciones', href: '#', icon: Pill, color: 'bg-gradient-to-r from-teal-400 to-teal-600' },
    { title: 'Reportes', href: '#', icon: FileText, color: 'bg-gradient-to-r from-indigo-400 to-indigo-600' }
  ]

  //Busqueda en los modales
  const pacientesFiltradosConsulta = (pacientes || []).filter(p =>
    p.nombre.toLowerCase().includes(busquedaConsulta.toLowerCase())
  )

  const pacientesFiltradosHistorial = (pacientes || []).filter(p =>
    p.nombre.toLowerCase().includes(busquedaHistorial.toLowerCase())
  )

  //logica de notificaciones
    useEffect(() => {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        const registrarNotificaciones = async () => {
          try {
            const messaging = getMessaging(firebaseApp)

            const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
            console.log("✅ Service Worker registrado")

            const currentToken = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
              serviceWorkerRegistration: registration,
            })

            if (currentToken) {
              console.log("🎯 Token FCM obtenido:", currentToken)

              const { data: auth } = await supabase.auth.getUser()
              const userId = auth?.user?.id

              if (userId) {
                const { data, error } = await supabase
                  .from('tokens_notificaciones')
                  .upsert(
                    [{ usuario_id: userId, token: currentToken }],
                    { onConflict: ['usuario_id'] }
                  )

                if (error) {
                  console.error("❌ Error al guardar token en Supabase:", error)
                } else {
                  console.log("✅ Token guardado en Supabase")
                }
              }
            } else {
              console.warn("⚠️ No se obtuvo el token. ¿Tal vez el usuario rechazó los permisos?")
            }

            onMessage(messaging, (payload) => {
              console.log("🔔 Notificación en foreground:", payload)

              const title = payload?.notification?.title || 'Nueva notificación'
              const body = payload?.notification?.body || 'Revisa tu agenda'

              if (Notification.permission === 'granted') {
                new Notification(title, {
                  body,
                  icon: '/logo.png',
                })
              }
            })
          } catch (err) {
            console.error("❌ Error registrando notificaciones:", err)
          }
        }

        registrarNotificaciones()
      }
    }, [])

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white p-6 pt-28">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#003f74]">Dashboard del Médico</h1>
            <p className="text-gray-500">Resumen de actividad médica diaria</p>
          </div>

          {/* Resumen del Día */}
          <section className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold text-[#003f74] mb-4">Resumen del Día</h2>
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
                    <p className="text-xs text-gray-400 mt-1">{item.change}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos Rápidos */}
            <div>
              <h2 className="text-2xl font-bold text-[#003f74] mb-4">Accesos Rápidos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
              <h2 className="text-2xl font-bold text-[#003f74] mb-4">Actividad Reciente</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Últimas Consultas */}
                <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-[#005b96]">
                    <FileText className="h-5 w-5" /> Últimas Consultas
                  </h3>
                  {consultas.map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-gray-50 p-3 rounded hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <AvatarFallback className="bg-[#003f74] text-white w-10 h-10">{c.avatar}</AvatarFallback>
                        <div>
                          <p className="font-medium text-gray-800">{c.patient}</p>
                          <p className="text-sm text-gray-500">{c.type}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-500 flex items-center justify-end gap-1">
                          <Clock className="w-4 h-4" /> {c.time}
                        </p>
                        <Badge className="bg-green-100 text-green-700 mt-1">Completada</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pacientes Recientes */}
                <div className="bg-white rounded-xl shadow-md p-4 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-green-600">
                    <User className="h-5 w-5" /> Pacientes Recientes
                  </h3>
                  {pacientes.map((p) => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <AvatarFallback className="bg-green-600 text-white w-10 h-10">{p.avatar}</AvatarFallback>
                        <div>
                          <p className="font-medium text-gray-800">{p.nombre}</p>
                          <p className="text-sm text-gray-500">{p.edad} años</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-500">{p.registeredAt}</p>
                        <Badge className="border border-gray-300 text-gray-600 mt-1">Nuevo</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

        {/* Modal de pacientes */}
        {mostrarModalPacientes && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto relative p-6">
              <button
                onClick={() => setMostrarModalPacientes(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 font-bold text-xl cursor-pointer"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-[#003f74] mb-4">Selecciona un Paciente</h2>

              {pacientes.length === 0 ? (
                <p className="text-gray-500">No hay pacientes registrados.</p>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    value={busquedaConsulta}
                    onChange={(e) => setBusquedaConsulta(e.target.value)}
                    className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {(pacientesFiltradosConsulta || []).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setPacienteSeleccionado(p)
                          setMostrarModalPacientes(false)
                        }}
                        className="p-3 rounded hover:bg-indigo-50 border border-gray-200 cursor-pointer transition"
                      >
                        <p className="font-medium text-gray-800">{p.nombre}</p>
                        <p className="text-sm text-gray-500">{p.edad} años — {p.telefono}</p>
                        <p className="text-xs text-gray-400">Registrado: {p.registradoAt}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal de historial de pacientes */}
        {mostrarModalHistorial && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto relative p-6">
              <button
                onClick={() => setMostrarModalHistorial(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-red-500 font-bold text-xl cursor-pointer"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-[#003f74] mb-4">Selecciona un paciente para ver su historial</h2>

              {pacientes.length === 0 ? (
                <p className="text-gray-500">No hay pacientes registrados.</p>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Buscar paciente..."
                    value={busquedaHistorial}
                    onChange={(e) => setBusquedaHistorial(e.target.value)}
                    className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
                  />
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {(pacientesFiltradosHistorial || []).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setPacienteParaHistorial(p)
                          setMostrarModalHistorial(false)
                        }}
                        className="p-3 rounded hover:bg-indigo-50 border border-gray-200 cursor-pointer transition"
                      >
                        <p className="font-medium text-gray-800">{p.nombre}</p>
                        <p className="text-sm text-gray-500">{p.edad} años — {p.telefono}</p>
                        <p className="text-xs text-gray-400">Registrado: {p.registradoAt}</p>
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