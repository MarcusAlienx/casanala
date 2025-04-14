'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { MenuItemProps } from '@/components/MenuItem';
import { addMenuItem, updateMenuItem } from './actions'; // Import server actions

interface MenuItemFormProps {
    item?: MenuItemProps | null;
    onClose: () => void;
}

export function MenuItemForm({ item, onClose }: MenuItemFormProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    // Initialize form state based on the item being edited or defaults
    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        price: item?.price?.toString() || '',
        category: item?.category || '',
        imageUrl: item?.imageUrl || '',
    });

    useEffect(() => {
        // Update form data if the item prop changes (e.g., opening edit form)
        setFormData({
            name: item?.name || '',
            description: item?.description || '',
            price: item?.price?.toString() || '',
            category: item?.category || '',
            imageUrl: item?.imageUrl || '',
        });
        setErrors({}); // Clear errors when item changes
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
           setErrors(prev => ({...prev, [name]: []})) // Clear error on change
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors({}); // Clear previous errors

        // Create FormData object
        const formDataObj = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            formDataObj.append(key, value);
        });

        startTransition(async () => {
            const action = item ? updateMenuItem.bind(null, item.id as string) : addMenuItem;
            const result = await action(formDataObj);

            if (result.success) {
                toast({ title: item ? "Platillo Actualizado" : "Platillo Agregado", description: result.message });
                onClose(); // Close the modal on success
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
                 if (result.errors) {
                    setErrors(result.errors);
                 }
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4">
                <h2 className="text-2xl font-semibold mb-4">{item ? 'Editar Platillo' : 'Agregar Platillo'}</h2>
                
                <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name[0]}</p>}
                </div>

                 <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Input id="category" name="category" value={formData.category} onChange={handleChange} required />
                     {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category[0]}</p>}
                </div>

                <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
                     {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description[0]}</p>}
                </div>

                <div>
                    <Label htmlFor="price">Precio (MXN)</Label>
                    <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
                     {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price[0]}</p>}
                </div>

                <div>
                    <Label htmlFor="imageUrl">URL de Imagen (Opcional)</Label>
                    <Input id="imageUrl" name="imageUrl" type="url" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." />
                     {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl[0]}</p>}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? (item ? 'Guardando Cambios...' : 'Agregando...') : (item ? 'Guardar Cambios' : 'Agregar Platillo')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
