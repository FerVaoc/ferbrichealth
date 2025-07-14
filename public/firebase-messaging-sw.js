//codigo
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyA0eYR5MT4FODOFGlfJ7FgYwInSk2MMRWU",
  authDomain: "ferbric-push-notifications.firebaseapp.com",
  projectId: "ferbric-push-notifications",
  storageBucket: "ferbric-push-notifications.appspot.com",
  messagingSenderId: "1025985181913",
  appId: "1:1025985181913:web:74dd26a5dce24ae47aa6c8",
  measurementId: "G-L345WRB24X"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notificación en segundo plano:', payload)

  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' 
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})


