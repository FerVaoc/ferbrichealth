'use client'

import Header from '@/components/Header'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RegistrarConsulta() {
  const router = useRouter()
  const [form, setForm] = useState({
    motivo: '', diagnostico: '', tratamiento: '', notas: '',
    medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '',
    tipo: '', resultados: '', observaciones: ''
  })

  const [pacienteId, setPacienteId] = useState(null)
  const [medicoId, setMedicoId] = useState(null)
  const [pacienteNombre, setPacienteNombre] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('pacienteId')
    if (id) {
      setPacienteId(id)
      localStorage.setItem('paciente_id', id)
      const fetchPaciente = async (id) => {
        const { data, error } = await supabase
          .from('pacientes')
          .select('nombre, apellido_paterno, apellido_materno')
          .eq('id', id)
          .single()
        if (!error && data) {
          const nombreCompleto = `${data.nombre} ${data.apellido_paterno} ${data.apellido_materno || ''}`.trim()
          setPacienteNombre(nombreCompleto)
        }
      }
      fetchPaciente(id)
    }

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMedicoId(user.id)
    }

    fetchUser()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pacienteId || !medicoId) return alert('Paciente o médico no seleccionado.')

    // Generar fecha local (hora real del usuario)
    const now = new Date()
    const fechaLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString()

    const response = await fetch('/api/registrarConsulta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        paciente_id: pacienteId,
        medico_id: medicoId,
        fecha: fechaLocal
      })
    })

    const result = await response.json()
    if (!response.ok) {
      alert('Error: ' + result.error)
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
          <h2 className="text-2xl font-bold text-center text-[#003f74] mb-6">Nueva Consulta</h2>

          {pacienteNombre && (
            <p className="text-center text-gray-600 mb-4">
              Paciente: <span className="font-semibold text-gray-800">{pacienteNombre}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div>
              <h3 className="text-lg font-semibold text-[#003f74] mb-3">Datos de consulta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Motivo</label><input name="motivo" required value={form.motivo} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Diagnóstico</label><input name="diagnostico" required value={form.diagnostico} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800" /></div>
                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Tratamiento</label><input name="tratamiento" required value={form.tratamiento} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800" /></div>
                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Notas</label><textarea name="notas" value={form.notas} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800"></textarea></div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#003f74] mb-3">Receta (opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['medicamento','dosis','frecuencia','duracion'].map(name => (
                  <div key={name}>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{name.charAt(0).toUpperCase() + name.slice(1)}</label>
                    <input name={name} value={form[name]} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800" />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Indicaciones</label>
                  <textarea name="indicaciones" value={form.indicaciones} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800"></textarea>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#003f74] mb-3">Análisis (opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
                  <input name="tipo" value={form.tipo} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Resultados</label>
                  <textarea name="resultados" value={form.resultados} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Observaciones</label>
                  <textarea name="observaciones" value={form.observaciones} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800"></textarea>
                </div>
              </div>
            </div>

            <div>
              <button type="submit" className="w-full p-3 text-white rounded-xl font-semibold bg-gradient-to-r from-[#003f74] to-[#006bb3] hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
                Guardar Consulta
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
