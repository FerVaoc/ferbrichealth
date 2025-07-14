// lib/firebaseClient.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIZaSyA0eYR5MIT4FOODOFGlFJ7FgYwInSk2MMRM",
  authDomain: "ferbric-push-notifications.firebaseapp.com",
  projectId: "ferbric-push-notifications",
  storageBucket: "ferbric-push-notifications.appspot.com",
  messagingSenderId: "1025985181913",
  appId: "1:1025985181913:web:74dd26a5dce24ae47aaae2",
  measurementId: "G-L34SWRB24X",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
