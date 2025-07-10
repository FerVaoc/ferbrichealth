import { Suspense } from 'react'
import NuevaCitaClient from './NuevaCitaClient'

export default function NuevaCitaPage() {
  return (
    <Suspense fallback={null}>
      <NuevaCitaClient />
    </Suspense>
  )
}
