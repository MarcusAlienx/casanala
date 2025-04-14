'use server';

import { revalidatePath } from 'next/cache';
import { firestoreAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue
import { z } from 'zod';

// --- Tipos y Esquemas --- 

// Tipo para un item dentro del pedido
export interface OrderItem {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
}

// Estados posibles del pedido
export type OrderStatus = 'pendiente' | 'preparando' | 'listo_recoger' | 'en_camino' | 'completado' | 'cancelado';

// Tipo para la información del cliente
export interface CustomerInfo {
    name: string;
    phone: string;
    address?: string; // Opcional, para entregas
    notes?: string; // Notas adicionales del cliente
}

// Tipo principal del Pedido
export interface Order {
    id: string;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    type: 'recoger' | 'domicilio';
    customer: CustomerInfo;
    createdAt: FieldValue; // Usar Timestamp del servidor
    updatedAt: FieldValue;
}

// Esquema Zod para validar la creación de un pedido desde el cliente
const CreateOrderSchema = z.object({
    items: z.array(z.object({
        id: z.union([z.string(), z.number()]),
        name: z.string(),
        price: z.number(),
        quantity: z.number().min(1),
    })).min(1, { message: "El pedido debe tener al menos un platillo." }),
    total: z.number().positive({ message: "El total del pedido debe ser positivo." }),
    type: z.enum(['recoger', 'domicilio']),
    customer: z.object({
        name: z.string().min(2, { message: "Se requiere el nombre del cliente." }),
        phone: z.string().min(10, { message: "Se requiere un teléfono válido." }),
        address: z.string().optional(), // Requerido si type es 'domicilio' (validación adicional podría ser necesaria)
        notes: z.string().optional(),
    }),
});

// --- Funciones CRUD para Pedidos --- 

/**
 * Crea un nuevo pedido en Firestore.
 * Llamada desde el frontend (página principal o checkout).
 */
export async function createOrder(data: z.infer<typeof CreateOrderSchema>): Promise<{ success: boolean; message: string; orderId?: string; errors?: any }> {
    const validatedFields = CreateOrderSchema.safeParse(data);

    if (!validatedFields.success) {
        console.error("Validation errors (createOrder):", validatedFields.error.flatten().fieldErrors);
        return { 
            success: false, 
            message: "Error de validación al crear el pedido.", 
            errors: validatedFields.error.flatten().fieldErrors 
        };
    }

    // Validación adicional: dirección requerida para domicilio
    if (validatedFields.data.type === 'domicilio' && !validatedFields.data.customer.address) {
         return { 
            success: false, 
            message: "La dirección es requerida para pedidos a domicilio.",
            errors: { customer: { address: ["La dirección es requerida."] } } // Ajusta la estructura del error según necesites
        };
    }

    try {
        const newOrderData = {
            ...validatedFields.data,
            status: 'pendiente' as OrderStatus,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };
        const docRef = await firestoreAdmin.collection('orders').add(newOrderData);
        console.log("Order created with ID: ", docRef.id);
        
        // Revalidar páginas de admin relevantes (opcional, depende de cómo se muestren)
        revalidatePath('/admin/cocina'); 
        revalidatePath('/admin/domicilio');
        revalidatePath('/admin/recoger');

        return { success: true, message: 'Pedido creado exitosamente.', orderId: docRef.id };
    } catch (error) {
        console.error("Error creating order: ", error);
        return { success: false, message: 'Error interno al crear el pedido.' };
    }
}

/**
 * Obtiene pedidos de Firestore, opcionalmente filtrados por estado o tipo.
 */
export async function getOrders(filter?: { status?: OrderStatus | OrderStatus[], type?: 'recoger' | 'domicilio' }): Promise<Order[]> {
    try {
        let query: FirebaseFirestore.Query = firestoreAdmin.collection('orders');

        // Aplicar filtros
        if (filter?.status) {
            const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
             if (statuses.length > 0) {
               query = query.where('status', 'in', statuses);
             }
        }
        if (filter?.type) {
            query = query.where('type', '==', filter.type);
        }

        // Ordenar por fecha de creación (más recientes primero)
        query = query.orderBy('createdAt', 'desc');

        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }

        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convertir Timestamps a string ISO o Date si es necesario para el cliente
                // createdAt: data.createdAt.toDate().toISOString(), 
                // updatedAt: data.updatedAt.toDate().toISOString(),
            } as Order; // Puede necesitar conversión de Timestamp
        });

        return orders;

    } catch (error) {
        console.error("Error fetching orders:", error);
        throw new Error('No se pudieron obtener los pedidos.');
    }
}

/**
 * Actualiza el estado de un pedido específico.
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<{ success: boolean; message: string }> {
    if (!orderId || !newStatus) {
        return { success: false, message: 'ID del pedido y nuevo estado son requeridos.' };
    }

    try {
        await firestoreAdmin.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`Order ${orderId} status updated to ${newStatus}`);
        
        // Revalidar páginas relevantes
        revalidatePath('/admin/cocina');
        revalidatePath('/admin/domicilio');
        revalidatePath('/admin/recoger');
        // Podrías revalidar una página de estado de pedido del cliente si existe
        // revalidatePath(`/pedido/${orderId}`); 

        return { success: true, message: 'Estado del pedido actualizado.' };
    } catch (error) {
        console.error(`Error updating status for order ${orderId}:`, error);
        return { success: false, message: 'Error al actualizar el estado del pedido.' };
    }
}
