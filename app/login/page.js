'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const tipoRef = useRef(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    emailRef.current.focus()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    const email = emailRef.current.value.trim()
    const password = passwordRef.current.value.trim()
    const tipo = tipoRef.current.value

    if (!email || !password) {
      setError('Por favor, complete todos los campos')
      return
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      setError('Credenciales inválidas')
      return
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', data.user.id)
      .single()

    if (usuarioError || !usuario) {
      setError('Usuario no encontrado en sistema')
      return
    }

    if (usuario.rol !== tipo) {
      setError('El tipo de usuario no coincide con el rol asignado')
      return
    }

    // Redireccionar según el rol
    if (usuario.rol === 'admin') {
      router.push('/admin/dashboard')
    } else if (usuario.rol === 'medico') {
      router.push('/admin/dashboardmedico')
    } else {
      router.push('/admin/dashboardasistente') // Asistente por defecto
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#003f74] to-[#006bb3] relative overflow-hidden">
      {/* Fondo con patron */}
      <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%20100%20100%27%3E%3Cdefs%3E%3Cpattern%20id=%27grid%27%20width=%2710%27%20height=%2710%27%20patternUnits=%27userSpaceOnUse%27%3E%3Cpath%20d=%27M%2010%200%20L%200%200%200%2010%27%20fill=%27none%27%20stroke=%27rgba(255,255,255,0.05)%27%20stroke-width=%270.5%27/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%27100%27%20height=%27100%27%20fill=%27url(%23grid)%27/%3E%3C/svg%3E')]"></div>

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl z-10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#003f74] text-white flex items-center justify-center text-2xl mx-auto mb-4">
            <i className="fas fa-user-shield"></i>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Iniciar Sesión</h1>
          <p className="text-gray-500 text-sm">Accede a tu cuenta profesional</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
            <select
              id="tipo"
              name="tipo"
              ref={tipoRef}
              required
              className="w-full p-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-800"
            >
              <option value="medico">Médico</option>
              <option value="asistente">Asistente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="mb-4 relative">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-[#006bb3] text-sm"></i>
              <input
                ref={emailRef}
                type="email"
                id="email"
                name="email"
                placeholder="ejemplo@correo.com"
                className="w-full pl-10 p-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#006bb3]"
                required
              />
            </div>
          </div>

          <div className="mb-4 relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                className="w-full pr-10 p-3 rounded-xl border-2 border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#006bb3]"
                required
              />
              <i
                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>

          <div className="text-right text-sm mb-4">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); alert('Funcionalidad en desarrollo.') }}
              className="text-[#006bb3] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            className="w-full p-3 text-white rounded-xl font-semibold bg-gradient-to-r from-[#003f74] to-[#006bb3] hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
          >
            Iniciar Sesión
          </button>
        </form>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md px-4 py-2">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
