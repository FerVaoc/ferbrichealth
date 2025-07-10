'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Calendar, Star, Award, ArrowRight } from 'lucide-react'

export default function Doctors() {
  const [medicos, setMedicos] = useState([])
  const carouselRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const fetchMedicos = async () => {
      const { data, error } = await supabase.from('medicos').select('id, nombre, especialidad, sexo')
      if (!error) setMedicos(data)
    }
    fetchMedicos()
  }, [])

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  const getAvatar = (sexo) => {
    if (sexo === 'femenino') return '/avatar-mujer.png'
    if (sexo === 'masculino') return '/avatar-hombre.png'
    return '/avatar-generico.png'
  }

  return (
    <section id="doctors" className="bg-[#f8f9fa] py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* Título */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[#003f74]">Conoce a Nuestros Especialistas</h2>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">
            Elige entre nuestros médicos certificados y agenda una cita fácilmente desde tu dispositivo.
          </p>
        </div>

        {/* Botones de navegación */}
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-gray-100 z-10"
        >
          <i className="fas fa-chevron-left text-gray-700"></i>
        </button>

        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-gray-100 z-10"
        >
          <i className="fas fa-chevron-right text-gray-700"></i>
        </button>

        {/* Carrusel de medicos */}
        <div
          ref={carouselRef}
          className="flex gap-6 scroll-smooth snap-x snap-mandatory px-4 py-6 overflow-x-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)'
          }}
        >
          {medicos.map((medico) => (
            <div
              key={medico.id}
              className="group min-w-[280px] max-w-[300px] bg-white border border-gray-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-500 p-8 snap-center flex flex-col items-center text-center relative overflow-hidden transform hover:-translate-y-2"
            >
              {/* Fondos decorativo (minimo efecto) */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full -translate-y-16 translate-x-16 opacity-60"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-50 to-purple-50 rounded-full translate-y-12 -translate-x-12 opacity-40"></div>

              {/* Avatar */}
              <div className="relative mb-6 group-hover:scale-105 transition-transform duration-300">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-blue-50 group-hover:ring-blue-100 transition-all duration-300">
                  <img
                    src={getAvatar(medico.sexo)}
                    alt="Avatar médico"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Estado */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Contenido */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Calificacion (quitar en un furuto o hacerlo dinamico) */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      className={`${
                        j < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      } transition-colors`}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                </div>

                {/* Nombre */}
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">
                  {medico.sexo === 'femenino' ? 'Dra.' : 'Dr.'} {medico.nombre}
                </h3>

                {/* Especialidad */}
                <div className="flex items-center gap-2 mb-5">
                  <Award size={16} className="text-blue-600" />
                  <p className="text-sm text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-full">
                    {medico.especialidad}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex gap-2 mb-6">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    Disponible
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    Certificado
                  </span>
                </div>

                {/* Botón (agenda cita) */}
                <button
                  onClick={() => router.push(`/nuevacita?medicoId=${medico.id}`)}
                  className="group/btn w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white px-6 py-3.5 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                  <Calendar size={18} className="relative z-10" />
                  <span className="relative z-10">Agendar Cita</span>
                  <ArrowRight size={16} className="relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
