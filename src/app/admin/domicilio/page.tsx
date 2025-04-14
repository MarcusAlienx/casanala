'use client';

import React, { useState, useEffect, useTransition } from 'react';
// Assuming actions and types are correctly defined in a shared or accessible location
import { getOrders, updateOrderStatus, Order, OrderStatus } from '../pedidos/actions'; 
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";

// Re-usable OrderCard component (could be moved to a shared location)
function OrderCard({ order, onStatusChange, isUpdating }: { order: Order; onStatusChange: (orderId: string, newStatus: OrderStatus) => void; isUpdating: boolean }) {
    const possibleStatus: OrderStatus[] = ['pendiente', 'preparando', 'listo_recoger', 'en_camino', 'completado', 'cancelado'];
    const getBadgeVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'pendiente': return 'default';
            case 'preparando': return 'secondary';
            case 'listo_recoger': return 'outline';
            case 'en_camino': return 'outline'; 
            case 'completado': return 'default'; 
            case 'cancelado': return 'destructive';
            default: return 'default';
        }
    };
    const createdAtDate = order.createdAt && typeof order.createdAt === 'object' && 'toDate' in order.createdAt 
        ? order.createdAt.toDate() 
        : new Date(); 

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start pb-2">
                <div>
                    <CardTitle className="text-lg">Pedido #{order.id.substring(0, 6)}</CardTitle>
                    <p className="text-sm text-muted-foreground">{order.type === 'domicilio' ? 'A Domicilio' : 'Para Recoger'}</p>
                </div>
                 <Badge variant={getBadgeVariant(order.status)}>{order.status}</Badge>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                    {format(createdAtDate, 'PPP p', { locale: es })}
                </p>
                <p><strong>Cliente:</strong> {order.customer.name} ({order.customer.phone})</p>
                {order.type === 'domicilio' && (
                    <p><strong>Dirección:</strong> {order.customer.address || 'No especificada'}</p>
                 )}
                {order.customer.notes && <p><strong>Notas:</strong> {order.customer.notes}</p>}
                <ul className="mt-2 text-sm list-disc list-inside bg-muted p-2 rounded">
                    {order.items.map(item => (
                        <li key={item.id}>{item.quantity} x {item.name}</li>
                    ))}
                </ul>
                <p className="font-bold mt-2 text-right">Total: ${order.total.toFixed(2)}</p>
                 <div className="mt-4 flex items-center gap-2">
                     <span className="text-sm">Estado:</span>
                     <Select 
                        defaultValue={order.status}
                        onValueChange={(value) => onStatusChange(order.id, value as OrderStatus)}
                        disabled={isUpdating}
                    >
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Cambiar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {possibleStatus.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 {/* Placeholder for future integration button */}
                 {/* <Button variant="outline" size="sm" className="mt-2 w-full">Enviar a Plataforma Externa</Button> */} 
            </CardContent>
        </Card>
    );
}

export default function AdminDomicilioPage() {
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, startUpdateTransition] = useTransition();

    // Fetch delivery orders on mount
    useEffect(() => {
        async function loadOrders() {
            setIsLoading(true);
            try {
                // Filter specifically for delivery orders
                const fetchedOrders = await getOrders({ type: 'domicilio' }); 
                setOrders(fetchedOrders);
            } catch (error: any) {
                toast({ title: "Error al cargar pedidos a domicilio", description: error.message, variant: "destructive" });
            }
            setIsLoading(false);
        }
        loadOrders();
    }, [toast]);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
         startUpdateTransition(async () => {
             const result = await updateOrderStatus(orderId, newStatus);
             if (result.success) {
                 toast({ title: "Estado Actualizado", description: result.message });
                 // Optimistic update: Update status locally immediately
                 setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: newStatus, updatedAt: new Date()} : o)); // Using client date as placeholder
             } else {
                 toast({ title: "Error al actualizar", description: result.message, variant: "destructive" });
             }
         });
    };

    // Function to simulate sending to external platform (placeholder)
    const handleSendToPlatform = (orderId: string) => {
        toast({ title: "Simulación", description: `Pedido ${orderId.substring(0,6)} enviado a plataforma externa (no implementado).` });
        // Here you would potentially call an API or update the order status
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Pedidos a Domicilio</h1>
            
            {isLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                 </div>
            ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No hay pedidos a domicilio activos.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            onStatusChange={handleStatusChange} 
                            isUpdating={isUpdating}
                        />
                        /* Example of adding the simulation button per card */
                        /* 
                        <div className="mt-[-1rem] p-4 pt-0">
                           <Button variant="outline" size="sm" className="w-full" onClick={() => handleSendToPlatform(order.id)}> 
                               Enviar a Plataforma Externa (Sim)
                           </Button> 
                        </div>
                        */
                    ))}
                </div>
            )}
        </div>
    );
}
