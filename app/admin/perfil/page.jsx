'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'

export default function Perfil() {
  const [perfil, setPerfil] = useState(null)
  const [medicoAsignado, setMedicoAsignado] = useState(null)

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre, email, rol')
        .eq('id', user.id)
        .single()

      if (error) return

      setPerfil(data)

      // Si es asistente, buscar el médico asignado
      if (data.rol === 'asistente') {
        const { data: asistenteData, error: errorAsistente } = await supabase
          .from('asistentes')
          .select('medico_id')
          .eq('id', user.id)
          .single()

        const medicoId = asistenteData?.medico_id

        if (medicoId) {
          const { data: medicoData } = await supabase
            .from('medicos')
            .select('nombre, sexo')
            .eq('id', medicoId)
            .single()

          if (medicoData) {
            const prefijo = medicoData.sexo === 'femenino' ? 'Dra.' : 'Dr.'
            setMedicoAsignado(`${prefijo} ${medicoData.nombre}`)
          }
        }
      }
    }

    fetchPerfil()
  }, [])

  return (
    <>
      <Header />
      <div className="pt-32 px-4 min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-[#003f74] flex items-center justify-center gap-2">
            <i className="fas fa-user-circle text-3xl"></i> Mi Perfil
          </h1>
          <p className="text-center text-gray-500">Información de tu cuenta</p>

          {perfil ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 font-medium">Rol</label>
                <div className="flex items-center border border-gray-300 rounded-xl p-3 text-gray-800 bg-gray-50">
                  <i className="fas fa-id-badge mr-3 text-gray-500"></i>
                  <span className="capitalize">{perfil.rol}</span>
                </div>
              </div>

              {/* Solo si es asistente */}
              {perfil.rol === 'asistente' && medicoAsignado && (
                <div>
                  <label className="block text-sm text-gray-600 font-medium">Médico asignado</label>
                  <div className="flex items-center border border-gray-300 rounded-xl p-3 text-gray-800 bg-gray-50">
                    <i className="fas fa-user-md mr-3 text-gray-500"></i>
                    <span>{medicoAsignado}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 font-medium">Nombre</label>
                <div className="flex items-center border border-gray-300 rounded-xl p-3 text-gray-800 bg-gray-50">
                  <i className="fas fa-user mr-3 text-gray-500"></i>
                  <span>{perfil.nombre}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 font-medium">Correo electrónico</label>
                <div className="flex items-center border border-gray-300 rounded-xl p-3 text-gray-800 bg-gray-50">
                  <i className="fas fa-envelope mr-3 text-gray-500"></i>
                  <span>{perfil.email}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400">Cargando perfil...</p>
          )}
        </div>
      </div>
    </>
  )
}
