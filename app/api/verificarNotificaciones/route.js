import { NextResponse } from 'next/server'
import admin from 'firebase-admin'
import { createClient } from '@supabase/supabase-js'

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY || '{}')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

// 🔑 Conectar con Supabase desde servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // usa la service role key para evitar restricciones
)

export async function GET() {
  try {
    const ahora = new Date().toISOString()

    // 🔍 Buscar notificaciones pendientes
    const { data: notificaciones, error } = await supabase
      .from('notificaciones_programadas')
      .select('*')
      .lte('fecha_envio', ahora)

    if (error) throw error
    if (!notificaciones.length) {
      return NextResponse.json({ ok: true, message: 'No hay notificaciones pendientes.' })
    }

    for (const notif of notificaciones) {
      // ✅ Enviar notificación
      await admin.messaging().send({
        notification: {
          title: notif.titulo,
          body: notif.cuerpo,
        },
        token: notif.token,
      })

      // 🗑️ Eliminar notificación de la tabla
      await supabase
        .from('notificaciones_programadas')
        .delete()
        .eq('id', notif.id)
    }

    return NextResponse.json({ ok: true, enviadas: notificaciones.length })
  } catch (err) {
    console.error('❌ Error al procesar notificaciones:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
