'use client'

import Header from '@/components/Header'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export default function AdminPacientes() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('consultas')
  const [pacientes, setPacientes] = useState([])
  const [consultas, setConsultas] = useState([])
  const [recetas, setRecetas] = useState([])
  const [analisis, setAnalisis] = useState([])
  const [signos, setSignos] = useState([])
  const [rolUsuario, setRolUsuario] = useState(null)
  const router = useRouter()
  const [modalPaciente, setModalPaciente] = useState(null)
  const searchParams = useSearchParams()

  useEffect(() => {
  const idDesdeURL = searchParams.get('pacienteId')
  if (idDesdeURL && pacientes.length > 0) {
    const encontrado = pacientes.find((p) => p.id === idDesdeURL)
    if (encontrado) setSelected(encontrado)
  }
}, [pacientes])

  useEffect(() => {
    const fetchPacientes = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('Usuario no autenticado')
        return
      }

      // Obtener rol desde la tabla usuarios
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (errorUsuario || !usuario) {
        console.error('Error al obtener el rol del usuario')
        return
      }

      const rol = usuario.rol
      setRolUsuario(rol)
      let medicoId = null

      // Determinar el ID del médico según el rol
      if (rol === 'medico') {
        medicoId = user.id
      } else if (rol === 'asistente') {
        const { data: asistenteData, error: errorAsistente } = await supabase
          .from('asistentes')
          .select('medico_id')
          .eq('id', user.id)
          .single()

        if (errorAsistente || !asistenteData) {
          console.error('No se encontró el médico asociado al asistente')
          return
        }

        medicoId = asistenteData.medico_id
      }

      // Consulta base para pacientes
      let query = supabase
        .from('pacientes')
        .select(`
          id,
          nombre,
          apellido_paterno,
          apellido_materno,
          fecha_nacimiento,
          fecha_registro,
          sexo,
          telefono,
          medico_id,
          medicos (
            nombre,
            sexo
          )
        `)

      // Si no es admin, filtrar por medico asignado
      if (rol !== 'admin' && medicoId) {
        query = query.eq('medico_id', medicoId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error al cargar pacientes:', error.message)
        return
      }

      const withEdad = data.map(p => {
        const nacimiento = new Date(p.fecha_nacimiento)
        const hoy = new Date()
        let edad = hoy.getFullYear() - nacimiento.getFullYear()
        const m = hoy.getMonth() - nacimiento.getMonth()
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--

        let prefijo = ''
        if (p.medicos?.sexo === 'femenino') prefijo = 'Dra.'
        else if (p.medicos?.sexo === 'masculino') prefijo = 'Dr.'

        return {
          ...p,
          nombreCompleto: `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno}`,
          edad,
          registrado: p.fecha_registro
            ? new Date(p.fecha_registro).toISOString().split('T')[0]
            : 'Fecha no disponible',
          nombreMedico: p.medicos?.nombre ? `${prefijo} ${p.medicos.nombre}` : 'No asignado'
        }
      })

      setPacientes(withEdad)
    }

    fetchPacientes()
  }, [])

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!selected) return

      const [c1, c2, c3, c4] = await Promise.all([
        supabase.from('consultas').select('*').eq('paciente_id', selected.id).order('fecha', { ascending: false }),
        supabase.from('recetas').select('*').eq('paciente_id', selected.id).order('fecha', { ascending: false }),
        supabase.from('analisis').select('*').eq('paciente_id', selected.id).order('fecha', { ascending: false }),
        supabase.from('signos_vitales').select('*').eq('paciente_id', selected.id).order('fecha', { ascending: false })
      ])

      if (!c1.error) setConsultas(c1.data)
      if (!c2.error) setRecetas(c2.data)
      if (!c3.error) setAnalisis(c3.data)
      if (!c4.error) setSignos(c4.data)
    }

    fetchHistorial()
  }, [selected])

  const filtered = pacientes.filter(p =>
    p.nombreCompleto.toLowerCase().includes(search.toLowerCase())
  )

  const handleNuevaConsulta = () => {
    if (selected) {
      router.push(`/admin/consulta?pacienteId=${selected.id}`)
    }
  }

  return (
  <>
    <Header />

    <div className="min-h-screen pt-24 px-4 pb-13.5 bg-gradient-to-br from-white via-blue-50 to-white flex flex-col lg:flex-row gap-6 overflow-hidden">

      {/* Sidebar */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl p-4 shadow-md h-[calc(100vh-150px)] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-[#003f74]">
          <i className="fas fa-users text-2xl"></i> Lista de Pacientes
        </h2>

        <input
          type="text"
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4 text-gray-800"
        />

        <div className="space-y-2">
          {filtered.length > 0 ? (
            filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className={`p-3 rounded cursor-pointer transition ${
                  selected?.id === p.id
                    ? 'bg-indigo-100 border border-indigo-400'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-semibold text-gray-700">{p.nombreCompleto}</div>
                <div className="text-sm text-gray-500">{p.edad} años</div>
                <div className="text-xs text-gray-400">
                  Registrado:{' '}
                  {p.fecha_registro
                    ? new Date(p.fecha_registro).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : '—'}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm text-center">No hay pacientes registrados</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full lg:w-2/3 bg-white rounded-xl p-6 lg:p-8 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#003f74]">
              {selected ? `📋 Historial de ${selected.nombreCompleto}` : '📋 Historial del Paciente'}
            </h2>
            <p className="text-sm text-gray-500">
              {selected ? `Edad: ${selected.edad} años` : 'Selecciona un paciente para ver el historial.'}
            </p>
          </div>

          {!selected && (
            <Link
              href="/admin/registropaciente"
              className="p-3 bg-gradient-to-r from-[#003f74] to-[#006bb3] text-white rounded-xl font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
            >
              + Nuevo Paciente
            </Link>
          )}
        </div>

        {rolUsuario && selected && (
          <>
            {/* Acciones */}
            <div className="flex gap-4 mb-8">
              {(rolUsuario === 'medico' || rolUsuario === 'admin') && (
                <button
                  onClick={handleNuevaConsulta}
                  className="p-3 bg-gradient-to-r from-[#003f74] to-[#006bb3] text-white rounded-xl font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-2 cursor-pointer"
                >
                  <i className="fas fa-notes-medical"></i> Nueva Consulta
                </button>
              )}

              <button
                onClick={() => router.push(`/admin/signos?pacienteId=${selected.id}`)}
                className="p-3 bg-gradient-to-r from-[#003f74] to-[#006bb3] text-white rounded-xl font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-2 cursor-pointer"
              >
                <i className="fas fa-heartbeat"></i> Registrar Signos
              </button>

              <button
                onClick={() => setModalPaciente(selected)}
                className="p-3 bg-gray-200 text-gray-800 rounded-xl font-semibold shadow hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-2 cursor-pointer"
              >
                <i className="fas fa-user"></i> Ver Detalles
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 mb-6">
              {['consultas', 'recetas', 'analisis', 'signos'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-[#003f74] to-[#006bb3] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Contenido por pestaña */}
            {activeTab === 'consultas' && (
              <div className="overflow-y-auto max-h-[calc(100vh-300px)] pr-2 space-y-4">
                {consultas.length === 0 ? (
                  <p className="text-gray-700">No hay consultas registradas para este paciente.</p>
                ) : (
                  consultas.map((c) => (
                    <div key={c.id} className="p-4 bg-gray-100 rounded">
                      <p className="text-sm text-gray-700">📅 {new Date(c.fecha).toLocaleDateString()}</p>
                      <p className="text-gray-700"><strong>Motivo:</strong> {c.motivo}</p>
                      <p className="text-gray-700"><strong>Diagnóstico:</strong> {c.diagnostico}</p>
                      <p className="text-gray-700"><strong>Tratamiento:</strong> {c.tratamiento}</p>
                      {c.notas && (
                        <p className="text-sm text-gray-700 mt-1">
                          <strong>Notas:</strong> {c.notas}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'recetas' && (
              <div className="overflow-y-auto max-h-[calc(100vh-300px)] pr-2 space-y-4">
                {recetas.length === 0 ? (
                  <p className="text-gray-700">No hay recetas registradas.</p>
                ) : (
                  recetas.map((r) => (
                    <div key={r.id} className="p-4 bg-gray-100 rounded">
                      <p className="text-sm text-gray-700">📅 {new Date(r.fecha).toLocaleDateString()}</p>
                      <p className="text-gray-700"><strong>Medicamento:</strong> {r.medicamento}</p>
                      <p className="text-gray-700"><strong>Dosis:</strong> {r.dosis}</p>
                      <p className="text-gray-700"><strong>Frecuencia:</strong> {r.frecuencia}</p>
                      <p className="text-gray-700"><strong>Duración:</strong> {r.duracion}</p>
                      {r.indicaciones && (
                        <p className="text-sm text-gray-700 mt-1">
                          <strong>Indicaciones:</strong> {r.indicaciones}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'analisis' && (
              <div className="overflow-y-auto max-h-[calc(100vh-300px)] pr-2 space-y-4">
                {analisis.length === 0 ? (
                  <p className="text-gray-700">No hay análisis registrados.</p>
                ) : (
                  analisis.map((a) => (
                    <div key={a.id} className="p-4 bg-gray-100 rounded">
                      <p className="text-sm text-gray-700">📅 {new Date(a.fecha).toLocaleDateString()}</p>
                      <p className="text-gray-700"><strong>Tipo:</strong> {a.tipo}</p>
                      <p className="text-gray-700"><strong>Resultados:</strong> {a.resultados}</p>
                      {a.observaciones && (
                        <p className="text-sm text-gray-700 mt-1">
                          <strong>Observaciones:</strong> {a.observaciones}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'signos' && (
              <div className="overflow-y-auto max-h-[calc(100vh-300px)] pr-2 space-y-4">
                {signos.length === 0 ? (
                  <p className="text-gray-700">No hay signos vitales registrados.</p>
                ) : (
                  signos.map((s) => (
                    <div key={s.id} className="p-4 bg-gray-100 rounded">
                      <p className="text-sm text-gray-700">📅 {new Date(s.fecha).toLocaleDateString()}</p>
                      <p className="text-gray-700"><strong>Peso:</strong> {s.peso} kg</p>
                      <p className="text-gray-700"><strong>Estatura:</strong> {s.estatura} cm</p>
                      <p className="text-gray-700"><strong>IMC:</strong> {s.imc}</p>
                      <p className="text-gray-700"><strong>Presión arterial:</strong> {s.presion_arterial}</p>
                      <p className="text-gray-700"><strong>Temperatura:</strong> {s.temperatura} °C</p>
                      <p className="text-gray-700"><strong>Frecuencia cardíaca:</strong> {s.frecuencia_cardiaca} lpm</p>
                      <p className="text-gray-700"><strong>Frecuencia respiratoria:</strong> {s.frecuencia_respiratoria}</p>
                      <p className="text-gray-700"><strong>Perímetro abdominal:</strong> {s.perimetro_abdominal} cm</p>
                      <p className="text-gray-700"><strong>Glucosa:</strong> {s.glucosa} mg/dL</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
         )}
       </div>
      </div>

      {/* Modal de Detalles del Paciente */}
        {modalPaciente && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-11/12 sm:w-full max-w-md p-6 rounded-xl shadow-xl relative text-gray-900">
              <button
                onClick={() => setModalPaciente(null)}
                className="absolute top-3 right-4 text-gray-600 hover:text-red-500 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-4 text-[#003f74]">Detalles del Paciente</h2>
              <p><span className="font-semibold">Nombre:</span> {modalPaciente.nombre} {modalPaciente.apellido_paterno} {modalPaciente.apellido_materno}</p>
              <p>
                <span className="font-semibold">Fecha de nacimiento:</span>{' '}
                {modalPaciente.fecha_nacimiento
                  ? new Date(modalPaciente.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : '—'}
              </p>
              <p><span className="font-semibold">Sexo:</span> {modalPaciente.sexo || '—'}</p>
              <p><span className="font-semibold">Teléfono:</span> {modalPaciente.telefono || '—'}</p>
              <p><span className="font-semibold">Fecha de registro:</span>{' '}
                {modalPaciente.fecha_registro
                  ? new Date(modalPaciente.fecha_registro).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
              <p><span className="font-semibold">Médico asignado:</span> {modalPaciente.nombreMedico}</p>
            </div>
          </div>
        )}
    </>
  )
}
