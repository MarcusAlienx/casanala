'use client';

import React from 'react';
import { Order, OrderStatus } from './actions'; // Asegúrate que la ruta sea correcta
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, CookingPot, CheckCircle } from 'lucide-react'; // Iconos para acciones

interface KitchenOrderTicketProps {
    order: Order;
    onStartPreparing: (orderId: string) => void;
    onMarkReady: (orderId: string) => void; 
    isUpdating: boolean;
}

// Formato simplificado para la cocina
export function KitchenOrderTicket({ 
    order, 
    onStartPreparing, 
    onMarkReady, 
    isUpdating 
}: KitchenOrderTicketProps) {

     // Determina la acción principal basada en el estado actual
    const primaryAction = order.status === 'pendiente' 
        ? { label: "Empezar Preparación", handler: () => onStartPreparing(order.id), icon: CookingPot } 
        : order.status === 'preparando'
        ? { label: "Marcar como Listo", handler: () => onMarkReady(order.id), icon: CheckCircle }
        : null; // No hay acción principal si ya está listo o en otro estado

    return (
        <Card className={`border-l-4 ${order.status === 'pendiente' ? 'border-blue-500' : 'border-orange-500'} flex flex-col h-full shadow-lg`}>
            <CardHeader className="p-3">
                <CardTitle className="text-lg flex justify-between items-center">
                    <span>#{order.id.substring(0, 6)} ({order.type === 'domicilio' ? 'Domicilio' : 'Recoger'})</span>
                     <span className="text-sm font-normal">
                        {order.createdAt && typeof order.createdAt === 'object' && 'toDate' in order.createdAt 
                            ? order.createdAt.toDate().toLocaleTimeString('es-MX', { hour: '2-digit', minute:'2-digit' }) 
                            : '--:--'}
                    </span>
                </CardTitle>
                 {order.customer.notes && (
                    <p className="text-sm text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/50 p-1 rounded border border-amber-300 dark:border-amber-700">
                        <strong>Nota:</strong> {order.customer.notes}
                    </p>
                )}
            </CardHeader>
            <Separator />
            <CardContent className="p-3 flex-1 space-y-1 overflow-y-auto">
                {order.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                        <span className="font-medium">{item.quantity}x</span> 
                        <span>{item.name}</span>
                        {/* Podría mostrar modificadores/opciones aquí si existieran */}
                    </div>
                ))}
            </CardContent>
            {primaryAction && (
                 <CardFooter className="p-2 border-t mt-auto">
                    <Button 
                        className="w-full" 
                        onClick={primaryAction.handler} 
                        disabled={isUpdating}
                        size="lg" // Botón más grande para táctil
                    >
                        <primaryAction.icon className="mr-2 h-5 w-5" />
                        {isUpdating ? 'Actualizando...' : primaryAction.label}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
