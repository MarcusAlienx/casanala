'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton"; // Para estado de carga

interface RoleGuardProps {
    allowedRoles: string[]; // Array de roles permitidos para esta página
    children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        // Mostrar un estado de carga mientras se verifica la autenticación y el rol
        return (
            <div className="container mx-auto p-4 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    // Si no está cargando y no hay usuario, o el rol no está permitido
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
        // Opción 1: Redirigir a una página de no autorizado o login
        // router.push('/unauthorized'); // O router.push('/login');
        // return null; 
        
        // Opción 2: Mostrar un mensaje de no autorizado directamente
        return (
             <div className="container mx-auto p-4 text-center">
                 <h1 className="text-2xl font-bold text-destructive mb-4">Acceso Denegado</h1>
                 <p className="text-muted-foreground">No tienes permiso para ver esta página.</p>
                 {/* Podrías añadir un botón para ir al inicio o login */} 
                 <Button variant="link" onClick={() => router.push('/')}>Ir a la página principal</Button>
                 {!user && <Button variant="link" onClick={() => router.push('/login')}>Iniciar Sesión</Button>}
             </div>
        );
    }

    // Si el usuario está autenticado y tiene el rol permitido, renderizar el contenido
    return <>{children}</>;
}

// Re-export Button if used above and not auto-imported correctly in consuming components
import { Button } from "@/components/ui/button"; 
