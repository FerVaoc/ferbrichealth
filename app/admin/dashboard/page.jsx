'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import { User, Stethoscope, UserPlus, Search } from 'lucide-react'

export default function DashboardAdmin() {
  const [medicos, setMedicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('medicos')
  const [asistentesTab, setAsistentesTab] = useState([])
  const [pacientesTab, setPacientesTab] = useState([])
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [pestañaActiva, setPestañaActiva] = useState('consultas')

  const [consultas, setConsultas] = useState([])
  const [recetas, setRecetas] = useState([])
  const [analisis, setAnalisis] = useState([])
  const [signos, setSignos] = useState([])

  const [originalMedicos, setOriginalMedicos] = useState([])
  const [originalAsistentes, setOriginalAsistentes] = useState([])
  const [originalPacientes, setOriginalPacientes] = useState([])

  // Modal pacientes
  const [modalPacientes, setModalPacientes] = useState(null)
  const [pacientes, setPacientes] = useState([])
  //Modal asistentes
  const [modalAsistentes, setModalAsistentes] = useState(null)
  const [asistentes, setAsistentes] = useState([])
  //Modal citas desde medico y asistente
  const [modalCitas, setModalCitas] = useState(null)
  const [citas, setCitas] = useState([])
  //Modal de citas desde paciente
  const [modalCitasPaciente, setModalCitasPaciente] = useState(null)
  const [citasPaciente, setCitasPaciente] = useState([])

  //Logo de avatar
  const AvatarFallback = ({ children, className = '' }) => (
    <div
      className={`flex items-center justify-center rounded-full bg-[#003f74] text-white font-semibold w-12 h-12 aspect-square text-lg ${className}`}
    >
      {children}
    </div>
  )

  //CARGA DE MEDICOS
  useEffect(() => {
    const fetchMedicos = async () => {
    const { data, error } = await supabase.from('medicos').select('*')
    if (error) console.error('Error al cargar médicos:', error)
    else {
      setMedicos(data)
      setOriginalMedicos(data)
    }
    setLoading(false)
  }
    fetchMedicos()
  }, [])

  //Cargar al paciente del medico
  const cargarPacientesDeMedico = async (medicoId) => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('medico_id', medicoId)

    if (error) {
      console.error('Error al cargar pacientes:', error)
      return
    }
    setPacientes(data)
    setModalPacientes(medicoId)
  }

  //Cargar al asistente del medico
  const cargarAsistentesDeMedico = async (medicoId) => {
    const { data, error } = await supabase
        .from('asistentes')
        .select('*')
        .eq('medico_id', medicoId)

    if (error) {
        console.error('Error al cargar asistentes:', error)
        return
    }
    setAsistentes(data)
    setModalAsistentes(medicoId)
    }

    //Cargar las citas del medico
    const cargarCitasDeMedico = async (medicoId) => {
    const { data, error } = await supabase
        .from('citas')
        .select(`
            id,
            fecha_hora,
            tipo,
            estado,
            motivo,
            notas_generales,
            pacientes:paciente_id (
                nombre,
                apellido_paterno,
                apellido_materno
            )
            `)
        .eq('medico_id', medicoId)
        .order('fecha_hora', { ascending: false })

    if (error) {
        console.error('Error al cargar citas:', error)
        return
    }
    setCitas(data)
    setModalCitas(medicoId)
    }

    //CARGA DE ASISTENTES
    useEffect(() => {
        const fetchAsistentes = async () => {
          const { data, error } = await supabase
            .from('asistentes')
            .select(`
              *,
              medico:medico_id (
                nombre
              )
            `)

          if (error) console.error('Error al cargar asistentes:', error)
          else {
            setAsistentesTab(data)
            setOriginalAsistentes(data)
          }
        }
        if (filtro === 'asistentes') {
            fetchAsistentes()
        }
        }, [filtro])

    //Cargar las citas del asistente
    const cargarCitasDeAsistente = async (asistenteId) => {
    const { data, error } = await supabase
        .from('citas')
        .select(`
        id,
        fecha_hora,
        tipo,
        estado,
        motivo,
        notas_generales,
        pacientes:paciente_id (
            nombre,
            apellido_paterno,
            apellido_materno
        )
        `)
        .eq('asistente_id', asistenteId)
        .order('fecha_hora', { ascending: false })

    if (error) {
        console.error('Error al cargar citas del asistente:', error)
        return
    }
    setCitas(data)
    setModalCitas(asistenteId)
    }

    //CARGA DE PACIENTES
    useEffect(() => {
    const fetchPacientes = async () => {
      const { data, error } = await supabase
        .from('pacientes')
        .select(`
          *,
          medicos:medico_id (
            nombre,
            sexo
          )
        `)

      if (error) console.error('Error al cargar pacientes:', error)
      else {
        setPacientesTab(data)
        setOriginalPacientes(data)
      }
    }
    if (filtro === 'pacientes') {
        fetchPacientes()
    }
    }, [filtro])

    //Cargar el historial del paciente
    useEffect(() => {
    const cargarHistorial = async () => {
        if (!pacienteSeleccionado) return

        const [c1, c2, c3, c4] = await Promise.all([
        supabase.from('consultas').select('*').eq('paciente_id', pacienteSeleccionado.id).order('fecha', { ascending: false }),
        supabase.from('recetas').select('*').eq('paciente_id', pacienteSeleccionado.id).order('fecha', { ascending: false }),
        supabase.from('analisis').select('*').eq('paciente_id', pacienteSeleccionado.id).order('fecha', { ascending: false }),
        supabase.from('signos_vitales').select('*').eq('paciente_id', pacienteSeleccionado.id).order('fecha', { ascending: false })
        ])

        if (!c1.error) setConsultas(c1.data)
        if (!c2.error) setRecetas(c2.data)
        if (!c3.error) setAnalisis(c3.data)
        if (!c4.error) setSignos(c4.data)
    }

    cargarHistorial()
    }, [pacienteSeleccionado])

    //Cargar citas del paciente desde pacientes (historial de las citas)
    const verHistorialCitasPaciente = async (paciente) => {
    const { data, error } = await supabase
        .from('citas')
        .select(`
        id,
        fecha_hora,
        medico_id,
        medicos:medico_id (
            nombre,
            sexo
        )
        `)
        .eq('paciente_id', paciente.id)
        .order('fecha_hora', { ascending: false })

    if (error) {
        console.error('Error al cargar citas del paciente:', error)
        return
    }
    setCitasPaciente(data)
    setModalCitasPaciente(paciente)
    }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white p-6 pt-28">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#003f74]">Dashboard del Administrador</h1>
            <p className="text-gray-500">Resumen general de médicos, asistentes y pacientes</p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {[
              { tab: 'medicos', label: 'Médicos', icon: Stethoscope, color: 'from-[#003f74] to-[#006bb3]' },
              { tab: 'asistentes', label: 'Asistentes', icon: UserPlus, color: 'from-green-400 to-green-600' },
              { tab: 'pacientes', label: 'Pacientes', icon: User, color: 'from-yellow-400 to-yellow-500' }
            ].map(({ tab, label, icon: Icon, color }) => (
              <button
                key={tab}
                onClick={() => setFiltro(tab)}
                className={`rounded-xl px-4 py-2 font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition text-white flex flex-col items-center cursor-pointer ${
                  filtro === tab
                    ? `bg-gradient-to-r ${color}`
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
          
          {/* Campo de busqueda */}
          {['medicos', 'asistentes', 'pacientes'].includes(filtro) && (
            <div className="mb-6 max-w-md relative">
              <Search className="absolute left-3 top-2.5 text-gray-600 w-5 h-5" />
              <input
                type="text"
                placeholder={`Buscar por nombre de ${filtro}`}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800 border border-gray-300 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#006bb3] bg-white"
                onChange={(e) => {
                  const search = e.target.value.toLowerCase().trim()

                  if (filtro === 'medicos') {
                    if (search === '') {
                      setMedicos(originalMedicos)
                    } else {
                      setMedicos(originalMedicos.filter((m) =>
                        (`${m.nombre ?? ''} ${m.apellido_paterno ?? ''}`.toLowerCase().includes(search))
                      ))
                    }
                  }

                  if (filtro === 'asistentes') {
                    if (search === '') {
                      setAsistentesTab(originalAsistentes)
                    } else {
                      setAsistentesTab(originalAsistentes.filter((a) =>
                        a.nombre.toLowerCase().includes(search)
                      ))
                    }
                  }

                  if (filtro === 'pacientes') {
                    if (search === '') {
                      setPacientesTab(originalPacientes)
                    } else {
                      setPacientesTab(originalPacientes.filter((p) =>
                        (`${p.nombre ?? ''} ${p.apellido_paterno ?? ''} ${p.apellido_materno ?? ''}`.toLowerCase().includes(search))
                      ))
                    }
                  }
                }}
              />
            </div>
          )}

          {/* SECCION DE MEDICOS*/}
          {filtro === 'medicos' && (
            <>
              {loading ? (
                <p className="text-gray-600">Cargando médicos...</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {medicos.map((medico) => (
                    <div
                      key={medico.id}
                      className="bg-white rounded-2xl shadow hover:shadow-md border p-5 flex flex-col justify-between transition"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <AvatarFallback>
                          {`${medico.nombre?.[0] ?? ''}${medico.apellido_paterno?.[0] ?? ''}`.toUpperCase()}
                        </AvatarFallback>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-[#003f74]">
                            {medico.sexo === 'femenino' ? 'Dra.' : 'Dr.'} {medico.nombre}
                          </h3>
                          <p className="text-sm text-gray-600">Especialidad: <span className="font-medium">{medico.especialidad}</span></p>
                          <p className="text-sm text-gray-600">Correo: <span className="font-medium">{medico.email}</span></p>
                          <p className="text-sm text-gray-600">Teléfono: <span className="font-medium">{medico.telefono}</span></p>
                          <p className="text-sm text-gray-600">
                            Fecha de ingreso:{" "}
                            <span className="font-medium">
                              {new Date(medico.fecha_ingreso + "T00:00:00").toLocaleDateString("es-MX", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        <button
                          onClick={() => cargarPacientesDeMedico(medico.id)}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#003f74] to-[#006bb3] text-white text-sm font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                        >
                          Ver Pacientes
                        </button>
                        <button
                          onClick={() => cargarAsistentesDeMedico(medico.id)}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white text-sm font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                        >
                          Ver Asistentes
                        </button>
                        <button
                          onClick={() => cargarCitasDeMedico(medico.id)}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-sm font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                        >
                          Ver Citas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* SECCION DE ASISTENTES */}
          {filtro === 'asistentes' && (
            <>
                {asistentesTab.length === 0 ? (
                <div className="text-center text-gray-600 text-lg font-medium py-10">
                    Aún no hay asistentes registrados.
                </div>
                ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {asistentesTab.map((asistente) => (
                    <div
                      key={asistente.id}
                      className="bg-white rounded-2xl shadow hover:shadow-md border p-5 flex flex-col justify-between transition"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <AvatarFallback>
                          {`${asistente.nombre?.[0] ?? 'A'}`.toUpperCase()}
                        </AvatarFallback>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-[#003f74]">{asistente.nombre}</h3>
                          <p className="text-sm text-gray-600">
                            Médico asignado: <span className="font-medium">Dr. {asistente.medico ? asistente.medico.nombre : '—'}</span>
                          </p>
                          <p className="text-sm text-gray-600">Cargo: <span className="font-medium">{asistente.cargo}</span></p>
                          <p className="text-sm text-gray-600">Correo: <span className="font-medium">{asistente.email}</span></p>
                          <p className="text-sm text-gray-600">Teléfono: <span className="font-medium">{asistente.telefono}</span></p>
                          <p className="text-sm text-gray-600">
                            Fecha de ingreso:{" "}
                            <span className="font-medium">
                              {new Date(asistente.fecha_ingreso + "T00:00:00").toLocaleDateString("es-MX", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        <button
                          onClick={() => cargarCitasDeAsistente(asistente.id)}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-sm font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                        >
                          Ver Citas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
            </>
            )}

          {/* SECCION DE PACIENTES */}
          {filtro === 'pacientes' && (
            <>
                {pacientesTab.length === 0 ? (
                <div className="text-center text-gray-600 text-lg font-medium py-10">
                    Aún no hay pacientes registrados.
                </div>
                ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pacientesTab.map((paciente) => (
                    <div
                      key={paciente.id}
                      className="bg-white rounded-2xl shadow hover:shadow-md border p-5 flex flex-col justify-between transition"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <AvatarFallback>
                          {`${paciente.nombre?.[0] ?? ''}${paciente.apellido_paterno?.[0] ?? ''}`.toUpperCase()}
                        </AvatarFallback>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-[#003f74]">
                            {paciente.nombre} {paciente.apellido_paterno} {paciente.apellido_materno}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Médico asignado:{" "}
                            <span className="font-medium">
                              {paciente.medicos ? `${paciente.medicos.sexo === "femenino" ? "Dra." : "Dr."} ${paciente.medicos.nombre}` : "—"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">Sexo: <span className="font-medium">{paciente.sexo}</span></p>
                          <p className="text-sm text-gray-600">Teléfono: <span className="font-medium">{paciente.telefono}</span></p>
                          <p className="text-sm text-gray-600">
                            Fecha de nacimiento:{" "}
                            <span className="font-medium">
                              {new Date(paciente.fecha_nacimiento + "T00:00:00").toLocaleDateString("es-MX", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Fecha de registro:{" "}
                            <span className="font-medium">
                              {new Date(paciente.fecha_registro).toLocaleDateString("es-MX", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        <button
                          onClick={() => {
                            setPacienteSeleccionado(paciente)
                            setPestañaActiva('consultas')
                          }}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white text-sm font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                        >
                          Ver Historial
                        </button>
                        <button
                          onClick={() => verHistorialCitasPaciente(paciente)}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-sm font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                        >
                          Ver Citas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
            </>
            )}
        </div>
      </div>

        {/* Modal de Historial del Paciente */}
        {pacienteSeleccionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-11/12 sm:w-full max-w-md p-6 rounded-xl shadow-xl relative text-gray-900">
            <button
                onClick={() => setPacienteSeleccionado(null)}
                className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-lg font-bold cursor-pointer"
            >
                ✕
            </button>

            <h2 className="text-xl font-bold mb-2 text-[#003f74]">
                Historial de {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido_paterno} {pacienteSeleccionado.apellido_materno}
            </h2>

            {/* Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 mb-6">
              {[
                { key: 'consultas', label: 'Consultas', icon: 'fas fa-stethoscope' },
                { key: 'recetas', label: 'Recetas', icon: 'fas fa-prescription-bottle-alt' },
                { key: 'analisis', label: 'Análisis', icon: 'fas fa-vials' },
                { key: 'signos', label: 'Signos', icon: 'fas fa-heartbeat' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPestañaActiva(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                    pestañaActiva === tab.key
                      ? 'bg-gradient-to-r from-[#003f74] to-[#006bb3] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenido por pestaña */}
            {pestañaActiva === 'consultas' && (
                <div>
                {consultas.length > 0 ? (
                    <ul className="space-y-2">
                    {consultas.map((c) => (
                        <li key={c.id} className="border p-3 rounded bg-gray-50">
                        <p className="text-sm text-gray-700 font-medium">
                          Fecha:{' '}
                          {new Date(c.fecha).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}{' '}
                          a las{' '}
                          {new Date(c.fecha).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">Motivo: {c.motivo}</p>
                        <p className="text-sm text-gray-600">Diagnóstico: {c.diagnostico}</p>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No hay consultas registradas.</p>
                )}
                </div>
            )}

            {pestañaActiva === 'recetas' && (
                <div>
                {recetas.length > 0 ? (
                    <ul className="space-y-2">
                    {recetas.map((r) => (
                        <li key={r.id} className="border p-3 rounded bg-gray-50">
                        <p className="text-sm text-gray-700 font-medium">
                          Fecha:{' '}
                          {new Date(r.fecha).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}{' '}
                          a las{' '}
                          {new Date(r.fecha).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">Medicamento: {r.medicamento}</p>
                        <p className="text-sm text-gray-600">Dosis: {r.dosis}</p>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No hay recetas registradas.</p>
                )}
                </div>
            )}

            {pestañaActiva === 'analisis' && (
                <div>
                {analisis.length > 0 ? (
                    <ul className="space-y-2">
                    {analisis.map((a) => (
                        <li key={a.id} className="border p-3 rounded bg-gray-50">
                        <p className="text-sm text-gray-700 font-medium">
                          Fecha:{' '}
                          {new Date(a.fecha).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}{' '}
                          a las{' '}
                          {new Date(a.fecha).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">Tipo: {a.tipo}</p>
                        <p className="text-sm text-gray-600">Resultados: {a.resultados}</p>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No hay análisis registrados.</p>
                )}
                </div>
            )}

            {pestañaActiva === 'signos' && (
                <div>
                {signos.length > 0 ? (
                    <ul className="space-y-2">
                    {signos.map((s) => (
                        <li key={s.id} className="border p-3 rounded bg-gray-50">
                        <p className="text-sm text-gray-700 font-medium">
                          Fecha:{' '}
                          {new Date(s.fecha).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}{' '}
                          a las{' '}
                          {new Date(s.fecha).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-gray-600">Peso: {s.peso} kg</p>
                        <p className="text-sm text-gray-600">Estatura: {s.estatura} m</p>
                        <p className="text-sm text-gray-600">Presión: {s.presion_arterial}</p>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No hay signos vitales registrados.</p>
                )}
                </div>
            )}
            </div>
        </div>
        )}

      {/* Modal Pacientes */}
      {modalPacientes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-11/12 sm:w-full max-w-md p-6 rounded-xl shadow-xl relative text-gray-900">
            <button
              onClick={() => setModalPacientes(null)}
              className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4 text-[#003f74]">Pacientes Asignados</h2>

            {pacientes.length > 0 ? (
              <ul className="space-y-3">
                {pacientes.map((p) => (
                  <li key={p.id} className="p-3 border rounded-lg shadow-sm bg-gray-50">
                    <p className="font-semibold text-[#005b96]">
                      {p.nombre} {p.apellido_paterno} {p.apellido_materno}
                    </p>
                    <p className="text-sm text-gray-600">
                      Sexo: {p.sexo} | Nacimiento: {p.fecha_nacimiento}
                    </p>
                    <p className="text-sm text-gray-600">Teléfono: {p.telefono}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Este médico aún no tiene pacientes registrados.</p>
            )}
          </div>
        </div>
      )}

    {/* Modal Asistentes */}
    {modalAsistentes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-11/12 sm:w-full max-w-md p-6 rounded-xl shadow-xl relative text-gray-900">
            <button
                onClick={() => setModalAsistentes(null)}
                className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-lg font-bold cursor-pointer"
            >
                ✕
            </button>

            <h2 className="text-xl font-bold mb-4 text-[#003f74]">Asistentes Asignados</h2>

            {asistentes.length > 0 ? (
                <ul className="space-y-3">
                {asistentes.map((a) => (
                    <li key={a.id} className="p-3 border rounded-lg shadow-sm bg-gray-50">
                    <p className="font-semibold text-[#005b96]">{a.nombre}</p>
                    <p className="text-sm text-gray-600">Correo: {a.email}</p>
                    <p className="text-sm text-gray-600">Teléfono: {a.telefono}</p>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-gray-500">Este médico aún no tiene asistentes registrados.</p>
            )}
            </div>
        </div>
        )}

    {/* Modal Citas */}
    {modalCitas && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-11/12 sm:w-full max-w-md p-6 rounded-xl shadow-xl relative text-gray-900">
            <button
                onClick={() => setModalCitas(null)}
                className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-lg font-bold cursor-pointer"
            >
                ✕
            </button>

            <h2 className="text-xl font-bold mb-4 text-[#003f74]">Citas del Médico</h2>

            {citas.length > 0 ? (
                <ul className="space-y-3">
                {citas.map((cita) => {
                    const fecha = new Date(cita.fecha_hora)
                    const fechaStr = fecha.toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                    })
                    const horaStr = fecha.toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit'
                    })

                    return (
                    <li key={cita.id} className="p-4 border rounded-lg bg-gray-50 shadow-sm">
                        <p className="font-semibold text-[#005b96]">
                        {fechaStr} - {horaStr}
                        </p>
                        <p className="text-sm text-gray-600">
                        Paciente: {cita.pacientes ? `${cita.pacientes.nombre} ${cita.pacientes.apellido_paterno} ${cita.pacientes.apellido_materno}` : '—'}
                        </p>
                        <p className="text-sm text-gray-600">Tipo: {cita.tipo}</p>
                        <p className="text-sm text-gray-600">Estado: {cita.estado}</p>
                        <p className="text-sm text-gray-600">Motivo: {cita.motivo || '—'}</p>
                        <p className="text-sm text-gray-600">Notas: {cita.notas_generales || '—'}</p>
                    </li>
                    )
                })}
                </ul>
            ) : (
                <p className="text-gray-500">Este médico no tiene citas registradas.</p>
            )}
            </div>
        </div>
        )}

        {/* Modal de historial de citas de paciente */}
            {modalCitasPaciente && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white w-11/12 sm:w-full max-w-md p-6 rounded-xl shadow-xl relative text-gray-900">
                <button
                    onClick={() => setModalCitasPaciente(null)}
                    className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-lg font-bold cursor-pointer"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold mb-4 text-[#003f74]">
                    Citas de {modalCitasPaciente.nombre} {modalCitasPaciente.apellido_paterno} {modalCitasPaciente.apellido_materno}
                </h2>

                {citasPaciente.length > 0 ? (
                    <ul className="space-y-3">
                    {citasPaciente.map((cita) => {
                        const fecha = new Date(cita.fecha_hora)
                        const fechaStr = fecha.toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                        })
                        const horaStr = fecha.toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                        })

                        return (
                        <li key={cita.id} className="p-4 border rounded-lg bg-gray-50 shadow-sm">
                            <p className="text-sm text-gray-600 font-semibold">📅 {fechaStr} — {horaStr}</p>
                            <p className="text-sm text-gray-600">
                              👨‍⚕️ Médico: {cita.medicos ? `${cita.medicos.sexo === 'femenino' ? 'Dra.' : 'Dr.'} ${cita.medicos.nombre}` : '—'}
                            </p>
                        </li>
                        )
                    })}
                    </ul>
                ) : (
                    <p className="text-gray-500">Este paciente no tiene citas registradas.</p>
                )}
              </div>
          </div>
        )}
    </>
  )
}
