'use server';

import { revalidatePath } from 'next/cache';
import { firestoreAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

// --- Tipos y Esquemas --- 

// Horario para un día específico
export interface DayHours {
    isOpen: boolean;
    open: string; // Formato HH:MM (ej. "09:00")
    close: string; // Formato HH:MM (ej. "22:00")
}

// Horarios semanales
export type WeeklyHours = {
    lunes: DayHours;
    martes: DayHours;
    miercoles: DayHours;
    jueves: DayHours;
    viernes: DayHours;
    sabado: DayHours;
    domingo: DayHours;
};

// Promoción activa
export interface Promotion {
    id: string; // Podría ser generado o definido por el usuario
    description: string;
    startDate?: string; // Formato YYYY-MM-DD (opcional)
    endDate?: string;   // Formato YYYY-MM-DD (opcional)
    isActive: boolean;
}

// Estructura del documento de configuración en Firestore
export interface SiteSettings {
    id?: string; // El ID del documento (ej. 'main')
    weeklyHours: WeeklyHours;
    promotions: Promotion[];
    lastUpdated?: FieldValue;
}

// Esquema Zod para validar DayHours
const DayHoursSchema = z.object({
    isOpen: z.boolean(),
    open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)" }).optional(),
    close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)" }).optional(),
}).refine(data => !data.isOpen || (data.open && data.close), {
    message: "Se requiere hora de apertura y cierre si el día está abierto",
    path: ['open', 'close'], // Aplica el error a ambos campos
});

// Esquema Zod para validar WeeklyHours
const WeeklyHoursSchema = z.object({
    lunes: DayHoursSchema,
    martes: DayHoursSchema,
    miercoles: DayHoursSchema,
    jueves: DayHoursSchema,
    viernes: DayHoursSchema,
    sabado: DayHoursSchema,
    domingo: DayHoursSchema,
});

// Esquema Zod para validar Promotion
const PromotionSchema = z.object({
    id: z.string().min(1), // ID es requerido
    description: z.string().min(5, { message: "Descripción muy corta."}),
    startDate: z.string().optional(), // Podría añadirse validación de fecha YYYY-MM-DD
    endDate: z.string().optional(),
    isActive: z.boolean(),
});

// Esquema Zod para validar todo el documento SiteSettings (para actualización)
const SiteSettingsSchema = z.object({
    weeklyHours: WeeklyHoursSchema,
    promotions: z.array(PromotionSchema),
});

const CONFIG_COLLECTION = 'configuration';
const SETTINGS_DOC_ID = 'siteSettings'; // Usar un ID fijo

// --- Funciones para Horarios y Promociones --- 

/**
 * Obtiene la configuración del sitio (horarios y promociones).
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
    try {
        const docRef = firestoreAdmin.collection(CONFIG_COLLECTION).doc(SETTINGS_DOC_ID);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log('Site settings document does not exist. Returning null or default.');
            // Podrías devolver un valor por defecto aquí si lo prefieres
            return null; 
        }
        
        // Asegurarse que todos los campos existen, especialmente arrays
        const data = docSnap.data() as any; // Cast temporalmente
        return {
            id: docSnap.id,
            weeklyHours: data.weeklyHours || getDefaultWeeklyHours(), // Proveer default si falta
            promotions: data.promotions || [], // Proveer default si falta
            lastUpdated: data.lastUpdated, // Puede ser undefined
        } as SiteSettings;

    } catch (error) {
        console.error("Error fetching site settings:", error);
        throw new Error('No se pudo obtener la configuración del sitio.');
    }
}

/**
 * Actualiza la configuración del sitio (horarios y promociones).
 */
export async function updateSiteSettings(data: any): Promise<{ success: boolean; message: string; errors?: any }> {
   
     // Validar los datos completos usando el esquema combinado
     // Necesitamos recibir weeklyHours y promotions como objetos/arrays
    const validatedFields = SiteSettingsSchema.safeParse(data); 

    if (!validatedFields.success) {
         console.error("Validation errors (updateSiteSettings):", validatedFields.error.flatten().fieldErrors);
        return { 
            success: false, 
            message: "Error de validación.", 
            errors: validatedFields.error.flatten().fieldErrors 
        };
    }

    try {
        const docRef = firestoreAdmin.collection(CONFIG_COLLECTION).doc(SETTINGS_DOC_ID);
        const updateData = {
            ...validatedFields.data,
            lastUpdated: FieldValue.serverTimestamp(),
        };

        await docRef.set(updateData, { merge: true }); // Usar set con merge para crear si no existe o actualizar
        
        console.log("Site settings updated successfully.");
        revalidatePath('/admin/horarios');
        // Revalidar otras páginas que muestren horarios/promos (ej. la principal)
        revalidatePath('/'); 

        return { success: true, message: 'Configuración actualizada exitosamente.' };
    } catch (error) {
        console.error("Error updating site settings: ", error);
        return { success: false, message: 'Error al actualizar la configuración.' };
    }
}

// Función helper para obtener horarios por defecto si no existen
function getDefaultWeeklyHours(): WeeklyHours {
    const defaultDay: DayHours = { isOpen: false, open: '09:00', close: '17:00' };
    return {
        lunes: { ...defaultDay },
        martes: { ...defaultDay },
        miercoles: { ...defaultDay },
        jueves: { ...defaultDay },
        viernes: { ...defaultDay },
        sabado: { ...defaultDay, isOpen: true, open: '10:00', close: '22:00' }, // Example
        domingo: { ...defaultDay, isOpen: true, open: '10:00', close: '20:00' }, // Example
    };
}
