'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { RoleGuard } from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getMenuItems } from "@/app/admin/menu/actions"; // Action para obtener menú
import { MenuItemProps } from '@/components/MenuItem'; // Tipo de item de menú
// Suponiendo que MenuList y CartDisplay puedan ser reutilizados o adaptados
import MenuList from '@/components/MenuList'; 
// Definir tipos necesarios aquí o importar
interface CartItem extends MenuItemProps { quantity: number; }
import { createOrder, CustomerInfo } from '@/app/admin/pedidos/actions'; // Action para crear pedido

// --- Componente Simple para Mostrar/Seleccionar Mesa (Placeholder) ---
function TableSelector({ selectedTable, onSelectTable }: { selectedTable: string; onSelectTable: (table: string) => void }) {
    // En una app real, esto podría venir de una lista de mesas configurables
    const tables = ['1', '2', '3', '4', '5', '6', 'Barra 1', 'Barra 2', 'Terraza 1']; 
    return (
        <div className="mb-4">
            <Label htmlFor="table-select" className="text-lg font-medium">Mesa:</Label>
            <Select value={selectedTable} onValueChange={onSelectTable}>
                <SelectTrigger id="table-select" className="w-full md:w-[180px] text-lg mt-1">
                    <SelectValue placeholder="Seleccionar Mesa" />
                </SelectTrigger>
                <SelectContent>
                    {tables.map(table => (
                        <SelectItem key={table} value={table} className="text-lg">{table}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// --- Componente Simple para Resumen de Pedido (Placeholder/Adaptación) ---
function OrderSummary({ cartItems, onUpdateQuantity, onRemoveItem, total, onSubmitOrder, isSubmitting }: {
    cartItems: CartItem[]; 
    onUpdateQuantity: (id: string | number, quantity: number) => void; 
    onRemoveItem: (id: string | number) => void; 
    total: number;
    onSubmitOrder: () => void;
    isSubmitting: boolean;
}) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>Pedido Actual</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100%-60px)] p-4">
                    {cartItems.length === 0 ? (
                        <p className="text-muted-foreground text-center">Agrega platillos al pedido.</p>
                    ) : (
                        <ul className="space-y-3">
                            {cartItems.map(item => (
                                <li key={item.id} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</Button>
                                        <span className="text-lg font-medium w-6 text-center">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemoveItem(item.id)}>X</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-3 border-t p-4">
                 <div className="flex justify-between items-center ">
                     <p className="font-semibold text-lg">Total:</p>
                     <p className="font-bold text-xl">${total.toFixed(2)} MXN</p>
                 </div>
                <Button 
                    className="w-full text-lg p-6" 
                    onClick={onSubmitOrder} 
                    disabled={cartItems.length === 0 || isSubmitting}
                >
                   {isSubmitting ? 'Enviando a Cocina...' : 'Enviar a Cocina'}
                </Button>
            </CardFooter>
        </Card>
    );
}

// --- Componente Principal de la Página de Mesero ---
export default function MeseroPage() {
    const { toast } = useToast();
    const [menuItems, setMenuItems] = useState<MenuItemProps[]>([]);
    const [isLoadingMenu, setIsLoadingMenu] = useState(true);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('1'); // Mesa por defecto
    const [isSubmitting, startSubmitTransition] = useTransition();

    // Cargar menú al montar
    useEffect(() => {
        async function loadMenu() {
            setIsLoadingMenu(true);
            try {
                const items = await getMenuItems();
                setMenuItems(items);
            } catch (error: any) {
                toast({ title: "Error al cargar menú", description: "No se pudo obtener el menú.", variant: "destructive" });
            }
            setIsLoadingMenu(false);
        }
        loadMenu();
    }, [toast]);

    // --- Manejadores del Carrito (Similares a Home, podrían refactorizarse a un hook) ---
    const handleAddToCart = (itemToAdd: MenuItemProps) => {
        setCartItems(prevCart => {
            const existingItem = prevCart.find(item => item.id === itemToAdd.id);
            if (existingItem) {
                return prevCart.map(item => item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item);
            } else {
                return [...prevCart, { ...itemToAdd, quantity: 1 }];
            }
        });
         // No mostrar toast aquí para no interrumpir al mesero
    };

    const handleUpdateCartQuantity = (id: string | number, quantity: number) => {
        if (quantity <= 0) {
            handleRemoveFromCart(id);
            return;
        }
        setCartItems(prevCart => prevCart.map(item => (item.id === id ? { ...item, quantity: quantity } : item)));
    };

    const handleRemoveFromCart = (id: string | number) => {
        setCartItems(prevCart => prevCart.filter(item => item.id !== id));
    };

    const cartTotal = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cartItems]);
    // --- Fin Manejadores Carrito ---

    // --- Manejador para Enviar Pedido ---
    const handleSubmitOrder = () => {
        if (cartItems.length === 0) {
            toast({ title: "Pedido Vacío", description: "Agrega platillos antes de enviar.", variant: "destructive" });
            return;
        }
        if (!selectedTable) {
             toast({ title: "Selecciona Mesa", description: "Por favor, selecciona la mesa para este pedido.", variant: "destructive" });
            return;
        }

        startSubmitTransition(async () => {
            const orderData = {
                items: cartItems.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })), 
                total: cartTotal,
                type: 'recoger' as 'recoger' | 'domicilio', // Marcar como 'recoger' o crear tipo 'sitio'
                customer: {
                    name: `Mesa ${selectedTable}`, // Usar la mesa como identificador
                    phone: 'N/A', // Teléfono no aplica para pedidos en sitio
                    // notes: 'Pedido en sitio' // Podría añadirse una nota interna
                },
            };
            const result = await createOrder(orderData);

            if (result.success) {
                toast({ title: "Pedido Enviado", description: `Pedido para Mesa ${selectedTable} enviado a cocina.` });
                setCartItems([]); // Limpiar carrito para el siguiente pedido
                // Podríamos cambiar a una mesa por defecto o mantener la actual
            } else {
                console.error("Order creation error:", result.errors);
                toast({ title: "Error al Enviar Pedido", description: result.message, variant: "destructive" });
            }
        });
    };
    // --- Fin Manejador Enviar Pedido ---

    return (
        <RoleGuard allowedRoles={['admin', 'mesero']}> 
            <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 p-4"> {/* Ajustar altura y layout */}
                
                {/* Columna Izquierda: Mesa y Menú */}
                <div className="md:w-3/5 lg:w-2/3 flex flex-col gap-4">
                    <TableSelector selectedTable={selectedTable} onSelectTable={setSelectedTable} />
                    <Card className="flex-1">
                        <CardHeader><CardTitle>Menú</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[calc(100vh-250px)]"> {/* Ajustar altura */} 
                                {isLoadingMenu ? (
                                    <div className="p-4 space-y-3">
                                         {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)} 
                                     </div>
                                ) : (
                                    <MenuList items={menuItems} onAddToCart={handleAddToCart} />
                                )}
                            </ScrollArea>
                        </CardContent>
                     </Card>
                </div>

                {/* Columna Derecha: Pedido Actual */}
                <div className="md:w-2/5 lg:w-1/3">
                    <OrderSummary 
                        cartItems={cartItems}
                        onUpdateQuantity={handleUpdateCartQuantity}
                        onRemoveItem={handleRemoveFromCart}
                        total={cartTotal}
                        onSubmitOrder={handleSubmitOrder}
                        isSubmitting={isSubmitting}
                    />
                </div>

            </div>
        </RoleGuard>
    );
}

// Re-importar Label por si acaso
import { Label } from "@/components/ui/label";
