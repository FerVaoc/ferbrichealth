'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [rol, setRol] = useState(null)
  const [medicoInfo, setMedicoInfo] = useState(null)
  const [usuarioInfo, setUsuarioInfo] = useState(null)
  const [perfilDropdownOpen, setPerfilDropdownOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setRol(null)
        return
      }

      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('rol, nombre')
        .eq('id', user.id)
        .single()

      if (usuarioData) {
        setRol(usuarioData.rol)
        if (usuarioData.rol === 'admin' || usuarioData.rol === 'asistente') {
          setUsuarioInfo(usuarioData)
        }
      }

      if (usuarioData?.rol === 'medico') {
        const { data: medico } = await supabase
          .from('medicos')
          .select('nombre, especialidad, sexo')
          .eq('id', user.id)
          .single()

        if (medico) {
          setMedicoInfo(medico)
        }
      }
    }

    fetchUserData()
  }, [])

  const obtenerPrefijo = (sexo) => {
    if (sexo === 'femenino') return 'Dra.'
    if (sexo === 'masculino') return 'Dr.'
    return ''
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-gradient-to-r from-[#011f4b] via-[#03396c] to-[#005b96] shadow-lg border-b border-white/10">
      <nav className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3 text-white">
        <div className="text-2xl font-bold flex items-center gap-2">
          <img
            src="/logo.png" // Logo cargado
            alt="Logo de FerbricHealth"
            className="w-8 h-8"
          />
          <span className="bg-gradient-to-r from-[#b3cde0] to-white bg-clip-text text-transparent">
            FerbricHealth
          </span>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-2xl"
        >
          <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        <ul className={`md:flex gap-6 font-medium text-sm lg:text-base ${menuOpen ? 'flex flex-col absolute top-full left-0 w-full bg-[#03396c] py-4 px-6 rounded-b-lg shadow-lg' : 'hidden md:flex'}`}>
          <li>
            <Link href="/" className="flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-full">
              <i className="fas fa-home"></i> Inicio
            </Link>
          </li>

          {rol === 'admin' && (
            <li>
              <Link href="/admin/dashboard" className="flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-full">
                <i className="fas fa-tachometer-alt"></i> Dashboard
              </Link>
            </li>
          )}

          {rol === 'medico' && (
            <li>
              <Link href="/admin/dashboardmedico" className="flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-full">
                <i className="fas fa-stethoscope"></i> Dashboard Médico
              </Link>
            </li>
          )}

          {rol === 'asistente' && (
            <li>
              <Link href="/admin/dashboardasistente" className="flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-full">
                <i className="fas fa-stethoscope"></i> Dashboard Asistente
              </Link>
            </li>
          )}

          {rol && (
            <>
              <li className="relative" onMouseEnter={() => setOpenDropdown('usuarios')} onMouseLeave={() => setOpenDropdown(null)}>
                <div className="flex flex-col">
                  <a href="#" className="flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-full">
                    <i className="fas fa-users"></i> Usuarios
                  </a>
                    <div className="absolute top-full left-0 pt-2 z-[60]">
                      {openDropdown === 'usuarios' && (
                        <div className="flex flex-col bg-white text-gray-700 shadow-md rounded-md min-w-[160px]">
                        {rol === 'admin' && (
                          <>
                            <a href="/admin/medico" className="px-4 py-2 hover:bg-gray-100">Médicos</a>
                            <a href="/admin/asistente" className="px-4 py-2 hover:bg-gray-100">Asistentes</a>
                          </>
                        )}
                        {rol === 'medico' && (
                          <a href="/admin/asistente" className="px-4 py-2 hover:bg-gray-100">Asistentes</a>
                        )}
                        {(rol === 'admin' || rol === 'medico' || rol === 'asistente') && (
                          <a href="/admin/paciente" className="px-4 py-2 hover:bg-gray-100">Pacientes</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>

              <li>
                <a href="/admin/agenda" className="flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-full">
                  <i className="fas fa-calendar-alt"></i> Agenda
                </a>
              </li>

              {/* Perfil */}
                <li
                  className="relative"
                  onMouseEnter={() => setPerfilDropdownOpen(true)}
                  onMouseLeave={() => setPerfilDropdownOpen(false)}
                >
                  <div className="flex flex-col">
                    <a href="#" className="flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-full">
                      <i className="fas fa-user-circle"></i>
                      {rol === 'medico' && medicoInfo ? (
                        <div className="flex flex-col leading-tight text-left">
                          <span className="font-semibold text-white text-sm">
                            {obtenerPrefijo(medicoInfo.sexo)} {medicoInfo.nombre}
                          </span>
                          <span className="text-xs text-gray-200">{medicoInfo.especialidad}</span>
                        </div>
                      ) : usuarioInfo ? (
                        <div className="flex flex-col leading-tight text-left">
                          <span className="font-semibold text-white text-sm">{usuarioInfo.nombre}</span>
                          <span className="text-xs text-gray-200 capitalize">{usuarioInfo.rol}</span>
                        </div>
                      ) : (
                        <span>Mi Perfil</span>
                      )}
                    </a>

                    <div className="absolute top-full left-0 md:left-1/2 transform md:-translate-x-1/2 pt-2 z-[60]">
                      {perfilDropdownOpen && (
                        <div className="flex flex-col bg-white text-gray-700 shadow-md rounded-md min-w-[160px] z-50">
                          <a href="/admin/perfil" className="px-4 py-2 hover:bg-gray-100">Mi Perfil</a>
                          <button onClick={handleLogout} className="text-left px-4 py-2 hover:bg-gray-100 cursor-pointer">Cerrar sesión</button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
            </>
          )}

          {!rol && (
            <li>
              <Link href="/login" className="flex items-center gap-2 hover:bg-white/20 px-4 py-2 rounded-full border border-white hover:bg-white hover:text-[#03396c] transition">
                <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}
