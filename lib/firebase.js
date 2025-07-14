import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: "AIzaSyA0eYR5MT4FODOFGlfJ7FgYwInSk2MMRWU",
  authDomain: "ferbric-push-notifications.firebaseapp.com",
  projectId: "ferbric-push-notifications",
  messagingSenderId: "1025985181913",
  appId: "1:1025985181913:web:74dd26a5dce24ae47aa6c8"
}

export const firebaseApp = initializeApp(firebaseConfig)
