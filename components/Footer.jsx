'use client'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 text-gray-800 pt-16 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        
        {/* Marca y contacto */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/logo.png" //logo creado y cargado
              alt="Logo FerbricHealth"
              className="w-9 h-9"
            />
            <h2 className="text-2xl font-bold text-gray-800">FerbricHealth</h2>
          </div>

          <p className="text-gray-600 leading-relaxed mb-4">
            FerbricHealth es una plataforma médica moderna que une a pacientes, médicos y personal clínico para brindar atención de calidad, organizada y accesible desde cualquier lugar.
          </p>

          <p className="text-gray-500 text-sm mb-1">
            <i className="fas fa-phone-alt mr-2"></i> +52 (961) 123-4567
          </p>
          <p className="text-gray-500 text-sm mb-4">
            <i className="fas fa-envelope mr-2"></i> info@ferbrichealth.com
          </p>

          <div className="flex gap-4">
            {['facebook-f', 'twitter', 'whatsapp', 'instagram'].map((icon, i) => (
              <a
                key={i}
                href="#"
                className="bg-gray-500 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg transition"
              >
                <i className={`fab fa-${icon}`}></i>
              </a>
            ))}
          </div>
        </div>

        {/* Servicios */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Servicios</h3>
          <ul className="space-y-2 text-gray-500 text-sm">
            <li><a href="#" className="hover:text-gray-800 transition">Gestión de Citas</a></li>
            <li><a href="#" className="hover:text-gray-800 transition">Historiales Médicos</a></li>
            <li><a href="#" className="hover:text-gray-800 transition">Recetas Digitales</a></li>
            <li><a href="#" className="hover:text-gray-800 transition">Análisis Clínicos</a></li>
            <li><a href="#" className="hover:text-gray-800 transition">Telemedicina</a></li>
          </ul>
        </div>

        {/* Soporte */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Ayuda y Soporte</h3>
          <ul className="space-y-2 text-gray-500 text-sm">
            <li><a href="#" className="hover:text-gray-800 transition">Centro de Ayuda</a></li>
            <li><a href="#" className="hover:text-gray-800 transition">Guías para Pacientes</a></li>
            <li><a href="#" className="hover:text-gray-800 transition">Manual para Médicos</a></li>
            <li><a href="#" className="hover:text-gray-800 transition">Soporte Técnico</a></li>
            <li><a href="#" className="hover:text-gray-800 transition">Preguntas Frecuentes</a></li>
          </ul>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="border-t border-gray-300 pt-6 pb-8 text-sm text-gray-500 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {currentYear} FerbricHealth. Todos los derechos reservados.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-800">Privacidad</a>
          <a href="#" className="hover:text-gray-800">Términos</a>
          <a href="#" className="hover:text-gray-800">Seguridad</a>
        </div>
      </div>
    </footer>
  )
}
