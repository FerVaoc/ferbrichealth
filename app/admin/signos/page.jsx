'use client'

import Header from '@/components/Header'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RegistrarSignos() {
  const router = useRouter()
  const [form, setForm] = useState({
    peso: '', estatura: '', presion_arterial: '', temperatura: '', frecuencia_cardiaca: '', frecuencia_respiratoria: '', perimetro_abdominal: '', glucosa: ''
  })

  const [pacienteId, setPacienteId] = useState(null)
  const [asistenteId, setAsistenteId] = useState(null)
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
      if (user) setAsistenteId(user.id)
    }

    fetchUser()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pacienteId || !asistenteId) return alert('Paciente o asistente no seleccionado.')

    let imc = null
    const peso = parseFloat(form.peso)
    const estatura = parseFloat(form.estatura)
    if (peso > 0 && estatura > 0) {
      imc = (peso / Math.pow(estatura / 100, 2)).toFixed(2)
    }

    const now = new Date()
    const fechaLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString()

    const response = await fetch('/api/registrarSignos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        imc,
        paciente_id: pacienteId,
        asistente_id: asistenteId,
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
          <h2 className="text-2xl font-bold text-center text-[#003f74] mb-6">Registrar Signos Vitales</h2>

          {pacienteNombre && (
            <p className="text-center text-gray-600 mb-4">
              Paciente: <span className="font-semibold text-gray-800">{pacienteNombre}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div>
              <h3 className="text-lg font-semibold text-[#003f74] mb-3">Signos vitales</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[['peso','Peso (kg)'], ['estatura','Estatura (cm)'], ['presion_arterial','Presión Arterial'], ['temperatura','Temperatura (°C)'], ['frecuencia_cardiaca','Frecuencia Cardíaca'], ['frecuencia_respiratoria','Frecuencia Respiratoria'], ['perimetro_abdominal','Perímetro Abdominal (cm)'], ['glucosa','Glucosa (mg/dL)']].map(([name, label]) => (
                  <div key={name}>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
                    <input name={name} type="text" value={form[name]} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl text-gray-800" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button type="submit" className="w-full p-3 text-white rounded-xl font-semibold bg-gradient-to-r from-[#003f74] to-[#006bb3] hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer">
                Guardar Signos
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
