// src/lib/firebaseClient.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore client SDK if needed client-side

// Tu configuración de Firebase desde las variables de entorno
// Asegúrate de prefijarlas con NEXT_PUBLIC_ para que estén disponibles en el cliente
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase App (asegurándose que solo se haga una vez)
let app;
if (!firebaseConfig.apiKey) {
  console.error("Firebase API key is missing. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set in your environment variables.");
} else {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

// Obtener instancias de los servicios que necesitas
const authClient = app ? getAuth(app) : null;
const firestoreClient = app ? getFirestore(app) : null; // Firestore para el cliente (si lo usas)

// Exportar las instancias
export { app, authClient, firestoreClient };

// Log para verificar si la configuración se cargó (opcional, solo para depuración)
// console.log("Firebase Client Config Loaded:", firebaseConfig.projectId ? "Project ID OK" : "Project ID MISSING");
