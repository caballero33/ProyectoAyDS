import { initializeApp } from "firebase/app"
import { getAnalytics, isSupported } from "firebase/analytics"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAW-VPVlF4wKeLvSNgpfxcaLlsLPc6G-1w",
  authDomain: "minosadb.firebaseapp.com",
  projectId: "minosadb",
  storageBucket: "minosadb.firebasestorage.app",
  messagingSenderId: "1011602813793",
  appId: "1:1011602813793:web:f143d47fa9a55a3c604b20",
  measurementId: "G-EGMT011FW8",
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

isSupported()
  .then((supported) => {
    if (supported) {
      getAnalytics(app)
    }
  })
  .catch(() => {
    // analytics no soportado (SSR/envs de pruebas)
  })
