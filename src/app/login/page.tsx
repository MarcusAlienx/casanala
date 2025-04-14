'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { signInWithEmailAndPassword, User } from 'firebase/auth';
import { authClient } from '@/lib/firebaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreClient } from '@/lib/firebaseClient';

// Función helper para obtener el rol del usuario (similar a la del AuthContext)
async function getUserRole(userId: string): Promise<string> {
    try {
        const userDocRef = doc(firestoreClient, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().role) {
            return userDocSnap.data().role;
        }
    } catch (error) {
        console.error("Error fetching user role during login:", error);
    }
    return 'cliente'; // Rol por defecto o en caso de error
}

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams(); // Hook para leer query params
    const { toast } = useToast();

    // Obtener la URL de redirección del parámetro 'redirectedFrom'
    const redirectedFrom = searchParams.get('redirectedFrom') || '/admin'; // Default a /admin

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(authClient, email, password);
            const user = userCredential.user;
            
            // Obtener el rol del usuario DESPUÉS de iniciar sesión
            const role = await getUserRole(user.uid);

            toast({ title: "Inicio de Sesión Exitoso", description: "Bienvenido de nuevo." });

            // Redirigir basado en rol o al 'redirectedFrom'
            let targetPath = redirectedFrom;
            
            // Permitir que 'redirectedFrom' tenga prioridad si existe y es válido
            // (Podrías añadir validación si quieres restringir a dónde puede redirigir)
            if (redirectedFrom && redirectedFrom !== '/login') {
                 targetPath = redirectedFrom;
            } else {
                // Redirección por defecto basada en rol si no hay 'redirectedFrom' válido
                switch (role) {
                    case 'admin':
                        targetPath = '/admin';
                        break;
                    case 'cocina':
                        targetPath = '/cocina'; // Asumiendo que existirá una ruta /cocina
                        break;
                    case 'mesero':
                        targetPath = '/mesero'; // Asumiendo que existirá una ruta /mesero
                        break;
                    default: // Incluyendo 'cliente' o rol no definido
                        targetPath = '/'; // Redirigir a la página principal
                        break;
                }
            }
            
            console.log(`Redirecting to: ${targetPath} (Role: ${role}, redirectedFrom: ${redirectedFrom})`);
            router.push(targetPath); // Redirigir a la ruta determinada

        } catch (error: any) {
            console.error("Login Error:", error);
            let errorMessage = "Ocurrió un error inesperado.";
            // Mapear códigos de error comunes de Firebase a mensajes en español
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = "Correo electrónico o contraseña incorrectos.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "El formato del correo electrónico no es válido.";
                    break;
                 case 'auth/too-many-requests':
                    errorMessage = "Demasiados intentos fallidos. Intenta más tarde.";
                    break;
                default:
                    errorMessage = error.message; // Usar mensaje por defecto si no se reconoce
            }
            setError(errorMessage);
            toast({ title: "Error de Inicio de Sesión", description: errorMessage, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-sm mx-auto">
            <CardHeader>
                <CardTitle>Iniciar Sesión (Empleados)</CardTitle>
                <CardDescription>Acceso al panel de administración y gestión.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* ... campos de email y contraseña sin cambios ... */}
                     <div>
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading}/>
                    </div>
                    <div>
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}/>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// Página de Login
export default function LoginPage() {
    // Suspense podría ser necesario si hay componentes que usan searchParams directamente en el renderizado inicial
    // import { Suspense } from 'react';
    // return <Suspense fallback={<div>Cargando...</div>}><LoginForm /></Suspense>;
    return (
         <div className="flex justify-center items-center pt-10">
             <LoginForm />
        </div>
    );
}
