'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { authClient } from '@/lib/firebaseClient'; // Import auth client instance
import { doc, getDoc } from 'firebase/firestore';
import { firestoreClient } from '@/lib/firebaseClient'; // Import firestore client instance

// Define la estructura del usuario en tu contexto, incluyendo el rol
interface AuthUser extends User {
    role?: string; // Añadir rol opcional
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    // Añadir funciones de login/logout si se manejan aquí
}

// Crear el Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Crear el Proveedor del Contexto
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribe;
        if (authClient) {
            unsubscribe = onAuthStateChanged(authClient, async (firebaseUser) => {
                if (firebaseUser) {
                    // Usuario conectado, obtener su rol de Firestore
                    try {
                        const userDocRef = doc(firestoreClient, 'users', firebaseUser.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        let role = 'cliente'; // Rol por defecto si no se encuentra o no está definido
                        if (userDocSnap.exists() && userDocSnap.data().role) {
                            role = userDocSnap.data().role; // Obtener rol desde Firestore
                        }
                        setUser({ ...firebaseUser, role }); // Guardar usuario con rol
                    } catch (error) {
                        console.error("Error fetching user role:", error);
                        setUser({ ...firebaseUser, role: 'cliente' }); // Asignar rol por defecto en caso de error
                    }
                } else {
                    // Usuario desconectado
                    setUser(null);
                }
                setLoading(false);
            });
        } else {
            console.warn("Firebase authClient is null.  Check Firebase configuration.");
            setLoading(false);
            return;
        }


        // Limpiar suscripción al desmontar
        return () => unsubscribe?.();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personalizado para usar el contexto
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

