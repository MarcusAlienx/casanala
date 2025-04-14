// src/lib/firebaseAdmin.ts
import admin from 'firebase-admin';

// Verifica si ya existe una instancia inicializada
if (!admin.apps.length) {
  try {
    // Intenta inicializar usando credenciales de aplicación por defecto
    // (Funciona en entornos de Google Cloud / Firebase Studio)
    admin.initializeApp({
        // No necesitas pasar credential explícitamente si GOOGLE_APPLICATION_CREDENTIALS está configurado
        // o si estás en un entorno de Firebase/GCP que las proporciona automáticamente.
        // Si no, necesitarías:
        // credential: admin.credential.cert(require('path/to/your/serviceAccountKey.json'))
        // projectId: process.env.FIREBASE_PROJECT_ID, // Opcional si se infiere
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error);
    // Podrías manejar diferentes errores aquí, por ejemplo, si las credenciales no se encuentran.
    // Para evitar errores fatales si la inicialización falla en algún contexto:
     if (error.code !== 'app/duplicate-app') {
         throw error; // Relanzar si no es un error de duplicado
     }
  }
}

const firestoreAdmin = admin.firestore();
const authAdmin = admin.auth(); // Exportar auth si es necesario
const storageAdmin = admin.storage(); // Exportar storage si es necesario

export { firestoreAdmin, authAdmin, storageAdmin };
