'use client';

import React, { useState, useEffect, useTransition } from 'react';
// Asegúrate que la ruta a las acciones y tipos sea correcta
import { getOrders, updateOrderStatus, Order, OrderStatus } from '../pedidos/actions'; 
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";

// Componente OrderCard reutilizado (asumiendo que está definido como antes o importado)
function OrderCard({ order, onStatusChange, isUpdating }: { order: Order; onStatusChange: (orderId: string, newStatus: OrderStatus) => void; isUpdating: boolean }) {
    const possibleStatus: OrderStatus[] = ['pendiente', 'preparando', 'listo_recoger', 'completado', 'cancelado']; // Estados relevantes para recoger
    const getBadgeVariant = (status: OrderStatus): "default" | "secondary" | "destructive" | "outline" => {
         switch (status) {
            case 'pendiente': return 'default';
            case 'preparando': return 'secondary';
            case 'listo_recoger': return 'outline'; // Estado clave aquí
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
                {/* No se muestra dirección para recoger */}
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
            </CardContent>
        </Card>
    );
}


export default function AdminRecogerPage() {
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, startUpdateTransition] = useTransition();

    // Estados relevantes para recoger
     const pickupStatuses: OrderStatus[] = ['pendiente', 'preparando', 'listo_recoger'];

    // Cargar pedidos para recoger al montar
    useEffect(() => {
        async function loadOrders() {
            setIsLoading(true);
            try {
                // Filtrar por tipo 'recoger' y estados relevantes
                const fetchedOrders = await getOrders({ type: 'recoger', status: pickupStatuses }); 
                setOrders(fetchedOrders);
            } catch (error: any) {
                toast({ title: "Error al cargar pedidos para recoger", description: error.message, variant: "destructive" });
            }
            setIsLoading(false);
        }
        loadOrders();
    }, [toast]);

    // Manejador para cambio de estado
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
         startUpdateTransition(async () => {
             const result = await updateOrderStatus(orderId, newStatus);
             if (result.success) {
                 toast({ title: "Estado Actualizado", description: result.message });
                 // Actualizar localmente o filtrar si ya no es relevante
                 if (!pickupStatuses.includes(newStatus) && newStatus !== 'completado' && newStatus !== 'cancelado') { // Keep completed/canceled for a bit?
                     setOrders(prev => prev.filter(o => o.id !== orderId));
                 } else {
                     setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: newStatus, updatedAt: new Date()} : o));
                 }
             } else {
                 toast({ title: "Error al actualizar", description: result.message, variant: "destructive" });
             }
         });
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Pedidos para Recoger</h1>
            
            {isLoading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                 </div>
            ) : orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No hay pedidos activos para recoger.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            onStatusChange={handleStatusChange} 
                            isUpdating={isUpdating}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
