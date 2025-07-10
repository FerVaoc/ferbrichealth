'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { UserPlus, UserCheck } from 'lucide-react'

export default function NuevaCitaClient() {
  const searchParams = useSearchParams()
  const medicoId = searchParams.get('medicoId')

  const [medico, setMedico] = useState(null)
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [horariosDisponibles, setHorariosDisponibles] = useState([])
  const [horaSeleccionada, setHoraSeleccionada] = useState('')

  // Primera vez
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [mensaje, setMensaje] = useState('')

  // Ya soy paciente
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])

  const generarHorariosDisponibles = () => {
    const horarios = []
    const inicio = 9 * 60
    const fin = 17 * 60
    const intervalo = 30
    for (let mins = inicio; mins < fin; mins += intervalo) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      horarios.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
    }
    return horarios
  }

  useEffect(() => {
    const fetchMedico = async () => {
      const { data, error } = await supabase
        .from('medicos')
        .select('*')
        .eq('id', medicoId)
        .single()
      if (!error) setMedico(data)
    }

    if (medicoId) fetchMedico()
  }, [medicoId])

  useEffect(() => {
    const cargarHorarios = async () => {
      if (!fechaSeleccionada || !medicoId) return

      const { data: citasOcupadas } = await supabase
        .from('citas')
        .select('fecha_hora')
        .eq('medico_id', medicoId)
        .gte('fecha_hora', `${fechaSeleccionada}T00:00:00`)
        .lt('fecha_hora', `${fechaSeleccionada}T23:59:59`)

      const horariosBase = generarHorariosDisponibles()
      const ocupadas = citasOcupadas?.map(cita =>
        new Date(cita.fecha_hora).toTimeString().slice(0, 5)
      ) || []
      const disponibles = horariosBase.filter(h => !ocupadas.includes(h))
      setHorariosDisponibles(disponibles)
    }

    cargarHorarios()
  }, [fechaSeleccionada, medicoId])

  const registrarCitaNueva = async () => {
    if (!nombre || !apellido || !telefono || !fechaSeleccionada || !horaSeleccionada) {
      setMensaje('Por favor, completa todos los campos y selecciona fecha y hora.')
      return
    }

    const { data: nuevoPaciente, error: errorPaciente } = await supabase
      .from('pacientes')
      .insert([{ nombre, apellido_paterno: apellido, telefono }])
      .select()
      .single()

    if (errorPaciente || !nuevoPaciente) {
      setMensaje('Error al registrar paciente.')
      return
    }

    const fechaHora = `${fechaSeleccionada}T${horaSeleccionada}`
    const { error: errorCita } = await supabase.from('citas').insert([
      {
        medico_id: medicoId,
        paciente_id: nuevoPaciente.id,
        fecha_hora: fechaHora,
        estado: 'pendiente',
        tipo: 'presencial',
        motivo: 'Primera cita agendada públicamente'
      }
    ])

    if (errorCita) {
      setMensaje('Error al registrar la cita.')
      return
    }

    setMensaje('✅ Cita registrada correctamente.')
    setNombre('')
    setApellido('')
    setTelefono('')
    setHoraSeleccionada('')
    setFechaSeleccionada('')
    setMostrarFormularioNuevo(false)
  }

  const buscarPacientes = async () => {
    if (!busqueda.trim()) return

    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .or(`nombre.ilike.%${busqueda}%,apellido_paterno.ilike.%${busqueda}%,telefono.ilike.%${busqueda}%`)

    if (!error) {
      setResultados(data)
    } else {
      console.error('Error al buscar pacientes:', error.message)
      setResultados([])
    }
  }

  const agendarConPacienteExistente = async (paciente) => {
    if (!fechaSeleccionada || !horaSeleccionada) {
      setMensaje('Selecciona fecha y hora antes de agendar.')
      return
    }

    const fechaHora = `${fechaSeleccionada}T${horaSeleccionada}`

    const { error } = await supabase.from('citas').insert([
      {
        medico_id: medicoId,
        paciente_id: paciente.id,
        fecha_hora: fechaHora,
        estado: 'pendiente',
        tipo: 'presencial',
        motivo: 'Cita agendada por paciente existente'
      }
    ])

    if (error) {
      setMensaje('Error al registrar la cita.')
    } else {
      setMensaje('✅ Cita registrada correctamente.')
      setHoraSeleccionada('')
      setFechaSeleccionada('')
      setBusqueda('')
      setResultados([])
      setMostrarBuscador(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white p-6 pt-24">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-[#003f74] mb-1">
          Agendar cita con {medico?.sexo === 'femenino' ? 'la Dra.' : 'el Dr.'} {medico?.nombre}
        </h2>
        <p className="text-blue-600 font-semibold mb-6">{medico?.especialidad}</p>

        {/* Fecha */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-700 font-medium">Selecciona una fecha:</label>
          <input
            type="date"
            className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-700"
            onChange={(e) => setFechaSeleccionada(e.target.value)}
          />
        </div>

        {/* Horarios */}
        {fechaSeleccionada && (
          <div className="mb-6">
            <label className="block mb-3 text-gray-700 font-medium">Horarios del día:</label>
            <div className="grid grid-cols-3 gap-3">
              {generarHorariosDisponibles().map((hora) => {
                const disponible = horariosDisponibles.includes(hora)
                return (
                  <div
                    key={hora}
                    onClick={() => disponible && setHoraSeleccionada(hora)}
                    className={`text-center font-semibold px-3 py-2 rounded-lg border transition select-none cursor-pointer
                      ${disponible
                        ? hora === horaSeleccionada
                          ? 'bg-[#003f74] text-white border-[#003f74] shadow-md'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 cursor-not-allowed'}`}
                  >
                    {hora}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-emerald-400 rounded-sm border border-emerald-600"></div> Disponible
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-red-400 rounded-sm border border-red-600"></div> No disponible
              </div>
            </div>
          </div>
        )}

        {/* Horario seleccionado */}
        {horaSeleccionada && (
          <p className="h-8 mt-4 text-sm text-[#003f74] font-medium">
            Horario seleccionado: <span className="font-bold">{horaSeleccionada}</span>
          </p>
        )}

        {/* Botones */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <button
            onClick={() => {
              setMostrarFormularioNuevo(true)
              setMostrarBuscador(false)
              setMensaje('')
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-4 py-3 rounded-xl w-full font-semibold shadow hover:shadow-md transition"
          >
            <UserPlus size={18} />
            Primera vez que agendo
          </button>

          <button
            onClick={() => {
              setMostrarFormularioNuevo(false)
              setMostrarBuscador(true)
              setMensaje('')
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#003f74] to-[#006bb3] hover:from-[#002f5c] hover:to-[#005a99] text-white px-4 py-3 rounded-xl w-full font-semibold shadow hover:shadow-md transition"
          >
            <UserCheck size={18} />
            Ya soy paciente
          </button>
        </div>

        {/* Formulario nuevo paciente */}
        {mostrarFormularioNuevo && (
          <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-[#003f74]">Tus datos</h3>

            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800"
            />
            <input
              type="text"
              placeholder="Apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800"
            />

            {mensaje && <p className="text-sm text-center text-[#003f74] font-medium">{mensaje}</p>}

            <button
              onClick={registrarCitaNueva}
              className="w-full bg-gradient-to-r from-[#003f74] to-[#006bb3] hover:from-[#002f5c] hover:to-[#005a99] text-white font-semibold py-3 rounded-xl shadow hover:shadow-md transition"
            >
              Confirmar y Agendar Cita
            </button>
          </div>
        )}

        {/* Buscador paciente existente */}
        {mostrarBuscador && (
          <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-[#003f74]">Buscar paciente</h3>

            <input
              type="text"
              placeholder="Nombre o teléfono"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarPacientes()}
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800"
            />

            <button
              onClick={buscarPacientes}
              className="w-full bg-gradient-to-r from-[#003f74] to-[#006bb3] hover:from-[#002f5c] hover:to-[#005a99] text-white font-semibold py-3 rounded-xl shadow hover:shadow-md transition"
            >
              Buscar
            </button>

            {resultados.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-800">
                {resultados.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => agendarConPacienteExistente(p)}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                  >
                    {p.nombre} {p.apellido_paterno} {p.apellido_materno}— <span className="text-gray-500 text-xs">{p.telefono}</span>
                  </li>
                ))}
              </ul>
            ) : (
              busqueda && <p className="text-sm text-gray-500 text-center">No se encontraron coincidencias.</p>
            )}

            {mensaje && <p className="text-sm text-center text-[#003f74] font-medium">{mensaje}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
