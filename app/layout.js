// app/layout.jsx
import './globals.css'

export const metadata = {
  title: 'FerbricHealth - Sistema de Gestión Médica',
  description: 'Gestión médica integral con citas, recetas, pacientes y más',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Aquí va el CDN de Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-white text-gray-800">{children}</body>
    </html>
  )
}
