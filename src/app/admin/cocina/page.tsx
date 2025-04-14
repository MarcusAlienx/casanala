'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { getOrders, updateOrderStatus, Order, OrderStatus } from '../pedidos/actions'; // Ajusta la ruta si es necesario
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from '@/components/RoleGuard';
import { KitchenOrderTicket } from './KitchenOrderTicket'; // Importar el nuevo componente
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Usar Tabs para columnas
import { ScrollArea } from "@/components/ui/scroll-area"; // Para hacer scroll dentro de columnas


export default function AdminCocinaPage() {
    const { toast } = useToast();
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [preparingOrders, setPreparingOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, startUpdateTransition] = useTransition();

    // Cargar y separar pedidos
    async function loadOrders() {
        setIsLoading(true);
        try {
            // Obtener todos los pedidos relevantes para la cocina
            const fetchedOrders = await getOrders({ status: ['pendiente', 'preparando'] }); 
            setPendingOrders(fetchedOrders.filter(o => o.status === 'pendiente'));
            setPreparingOrders(fetchedOrders.filter(o => o.status === 'preparando'));
        } catch (error: any) {
            toast({ title: "Error al cargar pedidos", description: error.message, variant: "destructive" });
            setPendingOrders([]);
            setPreparingOrders([]);
        }
        setIsLoading(false);
    }

    useEffect(() => {
        loadOrders();
        // TODO: Considerar implementar polling o suscripción a Firestore para actualizaciones en tiempo real
        // const interval = setInterval(loadOrders, 30000); // Recargar cada 30s (ejemplo simple)
        // return () => clearInterval(interval);
    }, [toast]);

    // Manejador genérico para cambio de estado
    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        startUpdateTransition(async () => {
            const result = await updateOrderStatus(orderId, newStatus);
            if (result.success) {
                toast({ title: "Estado Actualizado", description: `Pedido #${orderId.substring(0, 6)} ahora está ${newStatus}.` });
                // Volver a cargar los pedidos para reflejar el cambio entre columnas
                loadOrders(); 
            } else {
                toast({ title: "Error al actualizar", description: result.message, variant: "destructive" });
            }
        });
    };

    // Manejadores específicos para botones de acción
    const handleStartPreparing = (orderId: string) => {
        handleStatusChange(orderId, 'preparando');
    };

    const handleMarkReady = (orderId: string) => {
        // Determinar el siguiente estado basado en el tipo
        const order = [...pendingOrders, ...preparingOrders].find(o => o.id === orderId);
        const nextStatus: OrderStatus = order?.type === 'domicilio' ? 'en_camino' : 'listo_recoger';
        handleStatusChange(orderId, nextStatus);
    };

    return (
        <RoleGuard allowedRoles={['admin', 'cocina']}> 
            <div className="h-screen flex flex-col p-2 md:p-4 bg-muted/40">
                <h1 className="text-2xl md:text-3xl font-bold mb-4 px-2">Vista de Cocina</h1>
                
                {isLoading ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Skeleton className="h-full w-full" />
                         <Skeleton className="h-full w-full" />
                    </div>
                ) : (
                    <Tabs defaultValue="pendiente" className="flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 mb-2">
                            <TabsTrigger value="pendiente">Pendientes ({pendingOrders.length})</TabsTrigger>
                            <TabsTrigger value="preparando">En Preparación ({preparingOrders.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pendiente" className="flex-1 overflow-hidden">
                             <ScrollArea className="h-full p-1">
                                {pendingOrders.length === 0 ? (
                                    <p className="text-center text-muted-foreground pt-10">No hay pedidos pendientes.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {pendingOrders.map(order => (
                                            <KitchenOrderTicket 
                                                key={order.id} 
                                                order={order} 
                                                onStartPreparing={handleStartPreparing}
                                                onMarkReady={handleMarkReady} // Pasar aunque no se use en este estado
                                                isUpdating={isUpdating}
                                            />
                                        ))}
                                    </div>
                                 )}
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="preparando" className="flex-1 overflow-hidden">
                             <ScrollArea className="h-full p-1">
                                 {preparingOrders.length === 0 ? (
                                     <p className="text-center text-muted-foreground pt-10">No hay pedidos en preparación.</p>
                                 ) : (
                                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {preparingOrders.map(order => (
                                            <KitchenOrderTicket 
                                                key={order.id} 
                                                order={order} 
                                                onStartPreparing={handleStartPreparing} // Pasar aunque no se use en este estado
                                                onMarkReady={handleMarkReady}
                                                isUpdating={isUpdating}
                                            />
                                        ))}
                                    </div>
                                 )}
                             </ScrollArea>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
         </RoleGuard>
    );
}
