'use client'

export default function Services() {
  const servicios = [
    {
      icon: 'fa-user-shield',
      title: 'Administrador',
      subtitle: 'Gestión Completa',
      text: 'Administra todo tu centro médico desde una sola plataforma. Gestiona usuarios, configuraciones y supervisa la atención en tiempo real.',
    },
    {
      icon: 'fa-user-md',
      title: 'Médico / Médica Interna',
      subtitle: 'Atención Especializada',
      text: 'Consulta historiales, gestiona tus citas y colabora con otros especialistas para brindar una mejor atención a los pacientes.',
    },
    {
      icon: 'fa-user-nurse',
      title: 'Asistente / Enfermero',
      subtitle: 'Soporte Integral',
      text: 'Agenda citas, registra signos vitales y mantén al equipo médico informado para ofrecer un cuidado integral al paciente.',
    },
    {
      icon: 'fa-user',
      title: 'Paciente',
      subtitle: 'Tu salud en control',
      text: 'Accede a tus citas, recetas y resultados médicos desde cualquier lugar. Recibe atención personalizada y mantén tu historial siempre contigo.',
    }
  ]

  return (
    <section id="services" className="bg-gradient-to-r from-[#011f4b] via-[#03396c] to-[#005b96] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <div className="text-center mb-12 text-white animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Servicios Especializados</h2>
          <p className="text-blue-200 max-w-xl mx-auto text-lg">
            Soluciones adaptadas para cada tipo de usuario
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-wrap justify-center gap-8">
          {servicios.map((item, index) => (
            <div
              key={index}
              className="w-80 p-8 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md text-center shadow-lg hover:shadow-2xl hover:-translate-y-2 transition duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-20 h-20 mx-auto bg-[#b3cde0] rounded-2xl flex items-center justify-center mb-4">
                <i className={`fas ${item.icon} text-[#011f4b] text-3xl`}></i>
              </div>

              <div className={`inline-block mb-3 px-3 py-1 text-sm font-semibold rounded-full ${item.badgeColor}`}>
                {item.badge}
              </div>

              <h4 className="text-white text-xl font-bold mb-1">{item.title}</h4>
              <p className="text-blue-200 text-sm font-medium mb-4">{item.subtitle}</p>
              <p className="text-white/90 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
