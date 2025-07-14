import { NextResponse } from 'next/server'
import admin from 'firebase-admin'

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY || '{}')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { token, title, body: messageBody } = body

    const message = {
      notification: {
        title,
        body: messageBody,
      },
      token,
    }

    const response = await admin.messaging().send(message)
    console.log('✅ Notificación enviada:', response)

    return NextResponse.json({ ok: true, response })
  } catch (error) {
    console.error('❌ Error al enviar notificación:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
