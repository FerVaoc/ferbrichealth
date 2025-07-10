'use client'

import Header from '@/components/Header'
import { useRef, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegistroPaciente() {
  const nombreRef = useRef()
  const paternoRef = useRef()
  const maternoRef = useRef()
  const nacimientoRef = useRef()
  const sexoRef = useRef()
  const telefonoRef = useRef()
  const medicoRef = useRef()

  const [error, setError] = useState(null)
  const [medicos, setMedicos] = useState([])
  const router = useRouter()

  useEffect(() => {
    const fetchMedicos = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) return

      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .single()

      if (usuarioError || !usuario) return

      const rol = usuario.rol

      if (rol === 'admin') {
        // Admin puede ver todos los médicos
        const { data: todosMedicos } = await supabase
          .from('medicos')
          .select('id, nombre, sexo')

        const medicosFormateados = todosMedicos.map(m => ({
          id: m.id,
          nombre: `${m.sexo === 'femenino' ? 'Dra.' : 'Dr.'} ${m.nombre}`
        }))

        setMedicos(medicosFormateados)
      } else if (rol === 'medico') {
        // Médico solo se ve a sí mismo
        const { data: medicoData } = await supabase
          .from('medicos')
          .select('id, nombre, sexo')
          .eq('id', userId)
          .single()

        if (medicoData) {
          setMedicos([{
            id: medicoData.id,
            nombre: `${medicoData.sexo === 'femenino' ? 'Dra.' : 'Dr.'} ${medicoData.nombre}`
          }])
        }
      } else if (rol === 'asistente') {
        // Asistente ve al medico asignado
        const { data: asistenteData } = await supabase
          .from('asistentes')
          .select('medico_id')
          .eq('id', userId)
          .single()

        const medicoId = asistenteData?.medico_id

        if (medicoId) {
          const { data: medicoData } = await supabase
            .from('medicos')
            .select('id, nombre, sexo')
            .eq('id', medicoId)
            .single()

          if (medicoData) {
            setMedicos([{
              id: medicoData.id,
              nombre: `${medicoData.sexo === 'femenino' ? 'Dra.' : 'Dr.'} ${medicoData.nombre}`
            }])
          }
        }
      }
    }

    fetchMedicos()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nombre = nombreRef.current.value.trim()
    const apellido_paterno = paternoRef.current.value.trim()
    const apellido_materno = maternoRef.current.value.trim()
    const fecha_nacimiento = nacimientoRef.current.value
    const sexo = sexoRef.current.value
    const telefono = telefonoRef.current.value.trim()
    const medico_id = medicoRef.current.value || null

    if (!nombre || !apellido_paterno || !apellido_materno || !fecha_nacimiento || !sexo) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }

    const response = await fetch('/api/registrarPaciente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        apellido_paterno,
        apellido_materno,
        fecha_nacimiento,
        sexo,
        telefono,
        medico_id
      })
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result.error || 'Error al registrar paciente')
    } else {
      alert(result.message)
      router.push('/admin/paciente')
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white pt-24 px-6 pb-12">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center text-[#003f74] mb-6">Registrar Nuevo Paciente</h2>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input ref={nombreRef} type="text"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno</label>
              <input ref={paternoRef} type="text"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
              <input ref={maternoRef} type="text"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <input ref={nacimientoRef} type="date"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select ref={sexoRef}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" required>
                <option value="">Seleccionar</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input ref={telefonoRef} type="text"
                className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Asignar Médico</label>
              <select ref={medicoRef}
                className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800">
                <option value="">Seleccionar Médico</option>
                {medicos.map((medico) => (
                  <option key={medico.id} value={medico.id}>{medico.nombre}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <button type="submit"
                className="w-full p-3 text-white rounded-xl font-semibold bg-gradient-to-r from-[#003f74] to-[#006bb3] hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
                Registrar Paciente
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
