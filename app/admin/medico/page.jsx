'use client'

import Header from '@/components/Header'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminMedicos() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [medicos, setMedicos] = useState([])
  const [formData, setFormData] = useState({
    nombre: '', sexo: '', fecha_nacimiento: '', telefono: '', direccion: '',
    especialidad: '', cedula_profesional: '', fecha_ingreso: '', email: '', password: ''
  })

  useEffect(() => {
    const fetchMedicos = async () => {
      const { data, error } = await supabase
        .from('medicos')
        .select('id, nombre, especialidad, sexo')

      if (error) {
        console.error('Error al cargar médicos:', error)
      } else {
        setMedicos(data)
      }
    }

    fetchMedicos()
  }, [])

  /*Cargar datos de medico*/
  const handleSelect = async (medico) => {
  setSelected(medico.id)

  const { data, error } = await supabase
    .from('medicos')
    .select('*')
    .eq('id', medico.id)
    .single()

    if (error) {
      console.error('Error al obtener datos del médico:', error)
      return
    }

    setFormData({
      nombre: data.nombre || '',
      sexo: data.sexo || '',
      fecha_nacimiento: data.fecha_nacimiento || '',
      telefono: data.telefono || '',
      direccion: data.direccion || '',
      especialidad: data.especialidad || '',
      cedula_profesional: data.cedula_profesional || '',
      fecha_ingreso: data.fecha_ingreso || '',
      email: data.email || '',
      password: '' // No se precarga la contraseña
    })
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
  e.preventDefault()

    if (selected) {
      // ACTUALIZAR MÉDICO
      const { error } = await supabase
        .from('medicos')
        .update({
          nombre: formData.nombre,
          sexo: formData.sexo,
          fecha_nacimiento: formData.fecha_nacimiento,
          telefono: formData.telefono,
          direccion: formData.direccion,
          especialidad: formData.especialidad,
          cedula_profesional: formData.cedula_profesional,
          fecha_ingreso: formData.fecha_ingreso,
          email: formData.email
        })
        .eq('id', selected)

      if (error) {
        alert('Error al actualizar médico: ' + error.message)
        return
      }

      // ACTUALIZAR EN LA TABLA USUARIO
      await supabase
        .from('usuarios')
        .update({
          nombre: formData.nombre
        })
        .eq('id', selected)

      alert('Médico actualizado correctamente')

    } else {
      // REGISTRAR NUEVO MÉDICO
      const response = await fetch('/api/registrarMedico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        alert('Error: ' + result.error)
        return
      }

      alert(result.message)
    }

    // Reiniciar formulario y recargar lista
    setFormData({
      nombre: '', sexo: '', fecha_nacimiento: '', telefono: '', direccion: '',
      especialidad: '', cedula_profesional: '', fecha_ingreso: '', email: '', password: ''
    })
    setSelected(null)

    const { data, error } = await supabase
      .from('medicos')
      .select('id, nombre, especialidad')
    if (!error) setMedicos(data)
  }

  const filtered = medicos.filter(m => m.nombre.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <Header />
      <div className="min-h-screen pt-24 px-4 pb-13.5 bg-gradient-to-br from-white via-blue-50 to-white flex flex-col lg:flex-row gap-6 overflow-hidden">
      
        {/* Sidebar */}
        <div className="w-full lg:w-1/3 bg-white rounded-2xl p-4 shadow-xl h-[calc(100vh-150px)] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-[#003f74]">
            <i className="fas fa-stethoscope text-2xl"></i> Lista de Médicos
          </h2>

          <input
            type="text" placeholder="Buscar médico..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mb-4"
          />

          <div className="space-y-2">
            {filtered.length > 0 ? (
              filtered.map((m) => (
                <div
                  key={m.id} onClick={() => handleSelect(m)}
                  className={`p-3 rounded-xl cursor-pointer transition shadow-sm 
                    ${selected === m.id ? 'bg-indigo-100 border border-indigo-400' : 'hover:bg-gray-100'}`}
                >
                  <div className="font-semibold text-gray-700">
                    {m.sexo === 'femenino' ? 'Dra.' : 'Dr.'} {m.nombre}
                  </div>
                  <div className="text-sm text-gray-500">{m.especialidad}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm text-center">No hay médicos registrados</div>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl p-8 shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-[#003f74]">
            {selected ? 'Editar Médico' : 'Registrar Nuevo Médico'}
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-sm text-gray-700">Nombre completo</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-500" required />
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700">Sexo</label>
                <select name="sexo" value={formData.sexo} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800">
                  <option value="">Seleccionar</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700">Fecha de nacimiento</label>
                <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" />
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700">Teléfono</label>
                <input type="tel" name="telefono" placeholder="+52 961 123 4567" value={formData.telefono} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" />
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700">Fecha de ingreso</label>
                <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" />
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700">Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" />
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700">Especialidad</label>
                <select
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800"
                  required
                >
                  <option value="">Seleccionar especialidad</option>
                  <option value="Medicina General">Medicina General</option>
                  <option value="Pediatría">Pediatría</option>
                  <option value="Ginecología">Ginecología</option>
                  <option value="Cardiología">Cardiología</option>
                  <option value="Dermatología">Dermatología</option>
                  <option value="Neurología">Neurología</option>
                  <option value="Oftalmología">Oftalmología</option>
                  <option value="Ortopedia">Ortopedia</option>
                  <option value="Psiquiatría">Psiquiatría</option>
                  <option value="Urología">Urología</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700">Cédula Profesional</label>
                <input type="text" name="cedula_profesional" value={formData.cedula_profesional} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" />
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700">Correo electrónico</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" required />
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700">Contraseña</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" required />
              </div>
            </div>

            {selected ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="w-full sm:w-1/2 p-3 text-white rounded-xl font-semibold bg-gradient-to-r from-[#003f74] to-[#006bb3] hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                >
                  Actualizar Médico
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-1/2 p-3 text-white rounded-xl font-semibold bg-gradient-to-r from-red-400 to-red-800 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                >
                  Cancelar Edición
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full p-3 text-white rounded-xl font-semibold bg-gradient-to-r from-[#003f74] to-[#006bb3] hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
              >
                Registrar Médico
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
