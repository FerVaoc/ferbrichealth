'use client'

import Header from '@/components/Header'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminAsistentes() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [asistentes, setAsistentes] = useState([])
  const [medicoId, setMedicoId] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '', sexo: '', fecha_nacimiento: '', telefono: '', direccion: '',
    cargo: '', fecha_ingreso: '', email: '', password: ''
  })

  // ID del medico logueado
  useEffect(() => {
    const fetchMedicoId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setMedicoId(user.id)
    }

    fetchMedicoId()
  }, [])

  // Cargar asistentes al iniciar
    useEffect(() => {
      const fetchAsistentes = async () => {
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user

        if (!user) return

        // Obtener datos del usuario logueado
        const { data: perfil, error: perfilError } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user.id)
          .single()

        if (perfilError) {
          console.error('Error obteniendo rol:', perfilError)
          return
        }

        let query = supabase.from('asistentes').select('id, nombre, cargo')

        // Si es medico lo filtra por su ID
        if (perfil.rol === 'medico') {
          query = query.eq('medico_id', user.id)
        }

        const { data, error } = await query

        if (!error) {
          setAsistentes(data)
          setMedicoId(user.id)
        } else {
          console.error('Error cargando asistentes:', error)
        }
      }

      fetchAsistentes()
    }, [])

  const handleSelect = async (asistente) => {
    setSelected(asistente.id)

    const { data, error } = await supabase
      .from('asistentes')
      .select('*')
      .eq('id', asistente.id)
      .single()

    if (error) {
      console.error('Error al obtener datos del asistente:', error)
      return
    }

    setFormData({
      nombre: data.nombre || '',
      sexo: data.sexo || '',
      fecha_nacimiento: data.fecha_nacimiento || '',
      telefono: data.telefono || '',
      direccion: data.direccion || '',
      cargo: data.cargo || '',
      fecha_ingreso: data.fecha_ingreso || '',
      email: data.email || '',
      password: ''
    })
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
  e.preventDefault()

    if (!medicoId) {
      alert('Error: No se pudo obtener el ID del médico.')
      return
    }

    if (selected) {
      // ACTUALIZAR ASISTENTE
      const { error } = await supabase
        .from('asistentes')
        .update({
          nombre: formData.nombre,
          sexo: formData.sexo,
          fecha_nacimiento: formData.fecha_nacimiento,
          telefono: formData.telefono,
          direccion: formData.direccion,
          cargo: formData.cargo,
          fecha_ingreso: formData.fecha_ingreso,
          email: formData.email
        })
        .eq('id', selected)

      if (error) {
        alert('Error al actualizar asistente: ' + error.message)
        return
      }

      // ACTUALIZAR EN LA TABLA USUARIO
      await supabase
        .from('usuarios')
        .update({
          nombre: formData.nombre
        })
        .eq('id', selected)

      alert('Asistente actualizado correctamente')

    } else {
      // REGISTRAR ASISTENTE
      const response = await fetch('/api/registrarAsistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, medico_id: medicoId })
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
      cargo: '', fecha_ingreso: '', email: '', password: ''
    })
    setSelected(null)

    const { data, error } = await supabase
      .from('asistentes')
      .select('id, nombre, cargo')
      .eq('medico_id', medicoId)

    if (!error) setAsistentes(data)
  }

  const filtered = asistentes.filter(a =>
    a.nombre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Header />

      <div className="min-h-screen pt-24 px-4 pb-13.5 bg-gradient-to-br from-white via-blue-50 to-white flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full lg:w-1/3 bg-white rounded-2xl p-4 shadow-xl h-[calc(100vh-150px)] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-[#003f74]">
            <i className="fas fa-user-nurse text-2xl"></i> Lista de Asistentes
          </h2>

          <input
            type="text"
            placeholder="Buscar asistente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl text-gray-800 mb-4"
          />

          <div className="space-y-2">
            {filtered.length > 0 ? (
              filtered.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleSelect(a)}
                  className={`p-3 rounded-xl cursor-pointer transition shadow-sm ${
                    selected === a.id ? 'bg-indigo-100 border border-indigo-400' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold text-gray-700">{a.nombre}</div>
                  <div className="text-sm text-gray-500">{a.cargo}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm text-center">No hay asistentes registrados</div>
            )}
          </div>
        </div>

        {/* Formulario */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl p-8 shadow-md">
          <h2 className="text-xl font-semibold mb-6 text-[#003f74]">
            {selected ? 'Editar Asistente' : 'Registrar Nuevo Asistente'}
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-sm text-gray-700">Nombre completo</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" required />
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
                <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                  placeholder="+52 961 123 4567" className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800" />
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
                <label className="font-medium text-sm text-gray-700">Cargo</label>
                <select
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-800"
                  required
                >
                  <option value="">Seleccionar</option>
                  <option value="Asistente">Asistente</option>
                </select>
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
                  Actualizar Asistente
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
                Registrar Asistente
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
