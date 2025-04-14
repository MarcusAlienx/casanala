'use server';

import { revalidatePath } from 'next/cache';
import { firestoreAdmin } from '@/lib/firebaseAdmin';
import { MenuItemProps } from '@/components/MenuItem'; // Reutilizamos el tipo
import { z } from 'zod';

// Esquema para la validación de datos del platillo
const MenuItemSchema = z.object({
    name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
    description: z.string().optional(),
    price: z.number().positive({ message: "El precio debe ser un número positivo." }),
    category: z.string().min(1, { message: "La categoría es requerida." }),
    imageUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
});

// --- Funciones CRUD para Platillos --- 

/**
 * Obtiene todos los platillos de Firestore
 */
export async function getMenuItems(): Promise<MenuItemProps[]> {
    try {
        const snapshot = await firestoreAdmin.collection('menuItems').orderBy('category').orderBy('name').get();
        if (snapshot.empty) {
            return [];
        }
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<MenuItemProps, 'id'>),
        }));
        return items;
    } catch (error) {
        console.error("Error fetching menu items:", error);
        throw new Error('No se pudieron obtener los platillos.');
    }
}

/**
 * Agrega un nuevo platillo a Firestore
 */
export async function addMenuItem(formData: FormData): Promise<{ success: boolean; message: string; errors?: any }> {
    const rawData = Object.fromEntries(formData.entries());
    // Convertir precio a número
    const price = parseFloat(rawData.price as string);
    const validatedFields = MenuItemSchema.safeParse({
        ...rawData,
        price: isNaN(price) ? undefined : price, // Asegurar que el precio sea un número válido
        imageUrl: rawData.imageUrl || undefined, // Permitir URL vacía opcional
    });

    if (!validatedFields.success) {
        console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
        return { 
            success: false, 
            message: "Error de validación.", 
            errors: validatedFields.error.flatten().fieldErrors 
        };
    }

    try {
        const docRef = await firestoreAdmin.collection('menuItems').add(validatedFields.data);
        console.log("Document written with ID: ", docRef.id);
        revalidatePath('/admin/menu'); // Revalidar la página del menú de admin
        revalidatePath('/'); // Revalidar la página principal
        return { success: true, message: 'Platillo agregado exitosamente.' };
    } catch (error) {
        console.error("Error adding document: ", error);
        return { success: false, message: 'Error al agregar el platillo.' };
    }
}

/**
 * Actualiza un platillo existente en Firestore
 */
export async function updateMenuItem(id: string, formData: FormData): Promise<{ success: boolean; message: string; errors?: any }> {
     if (!id) return { success: false, message: 'ID del platillo no proporcionado.' };

    const rawData = Object.fromEntries(formData.entries());
    const price = parseFloat(rawData.price as string);
    const validatedFields = MenuItemSchema.safeParse({
        ...rawData,
        price: isNaN(price) ? undefined : price,
        imageUrl: rawData.imageUrl || undefined,
    });

    if (!validatedFields.success) {
        console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
        return { 
            success: false, 
            message: "Error de validación.",
            errors: validatedFields.error.flatten().fieldErrors 
        };
    }

    try {
        await firestoreAdmin.collection('menuItems').doc(id).update(validatedFields.data);
        console.log("Document updated with ID: ", id);
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true, message: 'Platillo actualizado exitosamente.' };
    } catch (error) {
        console.error("Error updating document: ", error);
        return { success: false, message: 'Error al actualizar el platillo.' };
    }
}

/**
 * Elimina un platillo de Firestore
 */
export async function deleteMenuItem(id: string): Promise<{ success: boolean; message: string }> {
    if (!id) return { success: false, message: 'ID del platillo no proporcionado.' };

    try {
        await firestoreAdmin.collection('menuItems').doc(id).delete();
        console.log("Document deleted with ID: ", id);
        revalidatePath('/admin/menu');
        revalidatePath('/');
        return { success: true, message: 'Platillo eliminado exitosamente.' };
    } catch (error) {
        console.error("Error deleting document: ", error);
        return { success: false, message: 'Error al eliminar el platillo.' };
    }
}
