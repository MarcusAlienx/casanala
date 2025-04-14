'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { authClient } from '@/lib/firebaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react'; // Import an icon

export function LogoutButton() {
    const { user, loading } = useAuth(); // Get user state from context
    const router = useRouter();
    const { toast } = useToast();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(authClient);
            toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
            router.push('/login'); // Redirect to login page after logout
        } catch (error: any) {
            console.error("Logout Error:", error);
            toast({ title: "Error al Cerrar Sesión", description: error.message, variant: "destructive" });
            setIsLoggingOut(false);
        } 
        // No necesitas setIsLoggingOut(false) en caso de éxito porque serás redirigido
    };

    // No mostrar nada si está cargando o no hay usuario
    if (loading || !user) {
        return null; 
    }

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout} 
            disabled={isLoggingOut}
        >
            <LogOut className="mr-2 h-4 w-4" /> {/* Add icon */}
            {isLoggingOut ? 'Cerrando Sesión...' : 'Cerrar Sesión'}
        </Button>
    );
}
