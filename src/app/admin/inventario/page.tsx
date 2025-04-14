'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"; // Para formularios
import { Label } from "@/components/ui/label";
import { InventoryItem, getInventoryItems, addInventoryItem, deleteInventoryItem, updateInventoryStock } from './actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Formulario para Agregar/Editar Item (Simplificado para Agregar) ---
function InventoryItemForm({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (formData: FormData) => Promise<void> }) {
    const [isPending, startTransition] = useTransition();
    const formRef = React.useRef<HTMLFormElement>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            await onSave(formData);
            // El componente padre cerrará el diálogo si onSave tiene éxito
            formRef.current?.reset(); // Reset form fields
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}> 
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar Item al Inventario</DialogTitle>
                </DialogHeader>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nombre del Item</Label>
                        <Input id="name" name="name" required disabled={isPending} />
                    </div>
                    <div>
                        <Label htmlFor="unit">Unidad (kg, L, pieza, paquete)</Label>
                        <Input id="unit" name="unit" required disabled={isPending} />
                    </div>
                    <div>
                        <Label htmlFor="stock">Stock Inicial</Label>
                        <Input id="stock" name="stock" type="number" step="any" defaultValue={0} required disabled={isPending} />
                    </div>
                     <div>
                        <Label htmlFor="lowStockThreshold">Umbral Bajo Stock (Opcional)</Label>
                        <Input id="lowStockThreshold" name="lowStockThreshold" type="number" step="any" disabled={isPending} />
                    </div>
                     <div>
                        <Label htmlFor="supplier">Proveedor (Opcional)</Label>
                        <Input id="supplier" name="supplier" disabled={isPending} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>{isPending ? 'Agregando...' : 'Agregar Item'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Componente Principal de la Página ---
export default function AdminInventarioPage() {
    const { toast } = useToast();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isUpdatingStock, startStockUpdateTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();

    // Cargar items al montar
    useEffect(() => {
        async function loadItems() {
            setIsLoading(true);
            try {
                const fetchedItems = await getInventoryItems();
                setItems(fetchedItems);
            } catch (error: any) {
                toast({ title: "Error al cargar inventario", description: error.message, variant: "destructive" });
            }
            setIsLoading(false);
        }
        loadItems();
    }, [toast]);

    // Manejador para guardar nuevo item
    const handleSaveNewItem = async (formData: FormData) => {
        const result = await addInventoryItem(formData);
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
            setIsFormOpen(false); // Cerrar modal
            // La revalidación debería actualizar la lista, pero podemos forzar recarga si es necesario
            // O añadir el item manualmente al estado para respuesta instantánea
        } else {
            toast({ title: "Error al agregar", description: result.message + (result.errors ? ` (${Object.keys(result.errors).join(', ')})` : ''), variant: "destructive" });
        }
    };

    // Manejador para eliminar item
    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Seguro que quieres eliminar "${name}" del inventario?`)) {
            startDeleteTransition(async () => {
                const result = await deleteInventoryItem(id);
                if (result.success) {
                    toast({ title: "Eliminado", description: result.message });
                } else {
                    toast({ title: "Error al eliminar", description: result.message, variant: "destructive" });
                }
            });
        }
    };

    // Manejador para actualizar stock (ej. desde un input en la tabla)
    const handleStockChange = (id: string, currentStock: number) => {
        const newStockString = prompt(`Nuevo stock para el item (actual: ${currentStock}):`, currentStock.toString());
        if (newStockString !== null) {
            const newStock = parseFloat(newStockString);
            if (!isNaN(newStock)) {
                startStockUpdateTransition(async () => {
                    const result = await updateInventoryStock(id, newStock);
                     if (result.success) {
                        toast({ title: "Stock Actualizado", description: result.message });
                    } else {
                        toast({ title: "Error al actualizar stock", description: result.message + (result.errors ? ` (${Object.keys(result.errors).join(', ')})` : ''), variant: "destructive" });
                    }
                });
            } else {
                toast({ title: "Entrada inválida", description: "Por favor ingrese un número válido para el stock.", variant: "destructive" });
            }
        }
    };

     // Convertir Timestamp a Date (si es necesario para mostrar)
    const formatTimestamp = (timestamp: any): string => {
        if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
            return format(timestamp.toDate(), 'Pp', { locale: es });
        }
        // Manejar casos donde el timestamp podría no estar o ser inválido
        return 'N/A'; 
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Control de Inventario</h1>
                <Button onClick={() => setIsFormOpen(true)}>Agregar Item</Button>
            </div>

            <Card>
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : items.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground">Inventario vacío. ¡Agrega un item!</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Umbral Bajo</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Últ. Act.</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id} className={item.lowStockThreshold !== undefined && item.stock <= item.lowStockThreshold ? 'bg-red-100 dark:bg-red-900/30' : ''}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="link" 
                                            onClick={() => handleStockChange(item.id, item.stock)}
                                            disabled={isUpdatingStock || isDeleting}
                                            className="p-0 h-auto hover:no-underline"
                                        >
                                            {item.stock}
                                         </Button>
                                     </TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell>{item.lowStockThreshold ?? '-'}</TableCell>
                                    <TableCell>{item.supplier ?? '-'}</TableCell>
                                     <TableCell className="text-xs">{formatTimestamp(item.lastUpdated)}</TableCell>
                                    <TableCell className="space-x-2">
                                        {/* Podríamos añadir un botón Editar aquí que abra el form con datos */}
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={() => handleDelete(item.id, item.name)}
                                            disabled={isDeleting || isUpdatingStock}
                                        >
                                            {isDeleting ? '...' : 'Eliminar'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <InventoryItemForm 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                onSave={handleSaveNewItem} 
            />
        </div>
    );
}
