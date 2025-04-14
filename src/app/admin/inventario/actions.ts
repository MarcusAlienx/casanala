'use server';

import { revalidatePath } from 'next/cache';
import { firestoreAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

// --- Tipos y Esquemas de Inventario --- 

export interface InventoryItem {
    id: string;
    name: string;        // Nombre del ingrediente/producto
    unit: string;         // Unidad de medida (ej: kg, L, pieza, paquete)
    stock: number;        // Cantidad actual en inventario
    lowStockThreshold?: number; // Umbral para alerta de bajo stock (opcional)
    supplier?: string;     // Proveedor (opcional)
    lastUpdated: FieldValue; // Timestamp de la última actualización
}

// Esquema para validar la creación/actualización de items
const InventoryItemSchema = z.object({
    name: z.string().min(2, { message: "El nombre es requerido." }),
    unit: z.string().min(1, { message: "La unidad es requerida." }),
    stock: z.number().min(0, { message: "El stock no puede ser negativo." }), // Permitir 0
    lowStockThreshold: z.number().min(0).optional(),
    supplier: z.string().optional(),
});

// Esquema para validar la actualización de stock
const UpdateStockSchema = z.object({
    stock: z.number().min(0, { message: "El stock no puede ser negativo." }),
});

// --- Funciones CRUD para Inventario --- 

/**
 * Obtiene todos los items del inventario de Firestore
 */
export async function getInventoryItems(): Promise<InventoryItem[]> {
    try {
        const snapshot = await firestoreAdmin.collection('inventoryItems').orderBy('name').get();
        if (snapshot.empty) {
            return [];
        }
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<InventoryItem, 'id'>),
            // Convertir Timestamp a Date o string si es necesario para el cliente
        }));
        return items;
    } catch (error) {
        console.error("Error fetching inventory items:", error);
        throw new Error('No se pudieron obtener los items del inventario.');
    }
}

/**
 * Agrega un nuevo item al inventario en Firestore
 */
export async function addInventoryItem(formData: FormData): Promise<{ success: boolean; message: string; errors?: any }> {
    const rawData = Object.fromEntries(formData.entries());
    // Convertir números
    const stock = parseFloat(rawData.stock as string);
    const lowStockThreshold = rawData.lowStockThreshold ? parseFloat(rawData.lowStockThreshold as string) : undefined;
    
    const validatedFields = InventoryItemSchema.safeParse({
        ...rawData,
        stock: isNaN(stock) ? undefined : stock,
        lowStockThreshold: (lowStockThreshold !== undefined && !isNaN(lowStockThreshold)) ? lowStockThreshold : undefined,
    });

    if (!validatedFields.success) {
        return { success: false, message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        const newItemData = { ...validatedFields.data, lastUpdated: FieldValue.serverTimestamp() };
        await firestoreAdmin.collection('inventoryItems').add(newItemData);
        revalidatePath('/admin/inventario'); 
        return { success: true, message: 'Item de inventario agregado.' };
    } catch (error) {
        console.error("Error adding inventory item: ", error);
        return { success: false, message: 'Error al agregar el item.' };
    }
}

/**
 * Actualiza el stock de un item de inventario existente.
 * Simplificado para solo actualizar el stock, podría expandirse para editar todo.
 */
export async function updateInventoryStock(id: string, newStock: number): Promise<{ success: boolean; message: string; errors?: any }> {
     if (!id) return { success: false, message: 'ID del item no proporcionado.' };

    const validatedFields = UpdateStockSchema.safeParse({ stock: newStock });

    if (!validatedFields.success) {
        return { success: false, message: "Error de validación.", errors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        await firestoreAdmin.collection('inventoryItems').doc(id).update({
            stock: validatedFields.data.stock,
            lastUpdated: FieldValue.serverTimestamp(),
        });
        revalidatePath('/admin/inventario');
        return { success: true, message: 'Stock actualizado.' };
    } catch (error) {
        console.error("Error updating stock: ", error);
        return { success: false, message: 'Error al actualizar el stock.' };
    }
}

/**
 * Elimina un item del inventario.
 */
export async function deleteInventoryItem(id: string): Promise<{ success: boolean; message: string }> {
    if (!id) return { success: false, message: 'ID del item no proporcionado.' };
    try {
        await firestoreAdmin.collection('inventoryItems').doc(id).delete();
        revalidatePath('/admin/inventario');
        return { success: true, message: 'Item eliminado.' };
    } catch (error) {
        console.error("Error deleting inventory item: ", error);
        return { success: false, message: 'Error al eliminar el item.' };
    }
}
