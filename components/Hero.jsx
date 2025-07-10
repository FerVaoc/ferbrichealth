'use client'

export default function Hero() {
  return (
    <section
      id="home"
      className="hero relative bg-gradient-to-br from-[#011f4b] via-[#03396c] to-[#005b96] text-white py-32 px-4 overflow-hidden"
    >
      {/* Efectos flotantes en el fondo (quitar, talvez) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#b3cde0]/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#6497b1]/20 rounded-full blur-3xl animate-float delay-[2s]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#005b96]/30 rounded-full blur-2xl animate-float delay-[4s]"></div>
      </div>

      {/* Fondo con patron */}
      <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%20100%20100%27%3E%3Cdefs%3E%3Cpattern%20id=%27grid%27%20width=%2710%27%20height=%2710%27%20patternUnits=%27userSpaceOnUse%27%3E%3Cpath%20d=%27M%2010%200%20L%200%200%200%2010%27%20fill=%27none%27%20stroke=%27rgba(255,255,255,0.1)%27%20stroke-width=%270.5%27/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%27100%27%20height=%27100%27%20fill=%27url(%23grid)%27/%3E%3C/svg%3E')]"></div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight animate-fade-in-up">
          Sistema de Gestión
          <span className="block bg-gradient-to-r from-[#b3cde0] to-white bg-clip-text text-transparent">
            Médica Integral
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/90 mb-8 animate-fade-in-up delay-[200ms]">
          Agenda tus citas, accede a tus historiales y recibe atención personalizada. También brindamos herramientas avanzadas para médicos, asistentes y administradores.
        </p>

        <div className="flex justify-center flex-wrap gap-4 animate-fade-in-up delay-[400ms]">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              const target = document.getElementById('doctors')
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' })
              }
            }}
            className="px-6 py-3 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-[#03396c] transition"
          >
            <i className="fas fa-info-circle mr-2"></i> Conocer Más
          </a>
        </div>
      </div>
    </section>
  )
}
