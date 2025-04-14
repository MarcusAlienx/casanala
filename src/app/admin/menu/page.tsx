'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { MenuItemProps } from '@/components/MenuItem';
import { MenuItemForm } from './MenuItemForm';
import { getMenuItems, deleteMenuItem } from './actions';
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from '@/components/RoleGuard'; // Importar RoleGuard

export default function AdminMenuPage() {
    const { toast } = useToast();
    const [menuItems, setMenuItems] = useState<MenuItemProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItemProps | null>(null);
    const [isDeleting, startDeleteTransition] = useTransition();

    useEffect(() => {
        async function loadMenu() {
            setIsLoading(true);
            try {
                const items = await getMenuItems();
                setMenuItems(items);
            } catch (error: any) {
                toast({ title: "Error al cargar menú", description: error.message, variant: "destructive" });
            }
            setIsLoading(false);
        }
        loadMenu();
    }, [toast]); 

    const handleOpenForm = (item: MenuItemProps | null = null) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEditingItem(null);
        setIsFormOpen(false);
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar "${name}"?`)) {
             startDeleteTransition(async () => {
                const result = await deleteMenuItem(id);
                if (result.success) {
                    toast({ title: "Platillo Eliminado", description: result.message });
                } else {
                    toast({ title: "Error al eliminar", description: result.message, variant: "destructive" });
                }
             });
        }
    };

    return (
        <RoleGuard allowedRoles={['admin']}> {/* Solo rol 'admin' puede acceder */} 
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Gestión de Menú</h1>
                    <Button onClick={() => handleOpenForm()}>Agregar Platillo</Button>
                </div>

                <Card>
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : menuItems.length === 0 ? (
                        <p className="p-4 text-center text-muted-foreground">No hay platillos en el menú. ¡Agrega uno!</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                     <TableHead>Imagen</TableHead>
                                     <TableHead>Nombre</TableHead>
                                     <TableHead>Categoría</TableHead>
                                     <TableHead>Precio</TableHead>
                                     <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {menuItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <img 
                                                src={item.imageUrl || '/images/placeholder.jpg'} 
                                                alt={item.name} 
                                                className="h-10 w-10 object-cover rounded-sm" 
                                                onError={(e) => (e.currentTarget.src = '/images/placeholder.jpg')} 
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell>${item.price.toFixed(2)}</TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleOpenForm(item)} disabled={isDeleting}>Editar</Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id as string, item.name)} disabled={isDeleting}>
                                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                             </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>

                {isFormOpen && (
                    <MenuItemForm 
                        item={editingItem}
                        onClose={handleCloseForm} 
                    />
                )}
            </div>
        </RoleGuard>
    );
}
