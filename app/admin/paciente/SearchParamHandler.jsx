'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function SearchParamHandler({ pacientes, setSelected }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const idDesdeURL = searchParams.get('pacienteId')
    if (idDesdeURL && pacientes.length > 0) {
      const encontrado = pacientes.find((p) => p.id === idDesdeURL)
      if (encontrado) setSelected(encontrado)
    }
  }, [pacientes])

  return null
}
