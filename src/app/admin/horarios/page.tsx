'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { getSiteSettings, updateSiteSettings, WeeklyHours, Promotion, DayHours } from './actions';
import { Trash2 } from 'lucide-react'; // Icono para eliminar promo

// --- Componente para Editar Horarios Semanales ---
function WeeklyHoursForm({ initialHours, onSave, isSaving }: {
    initialHours: WeeklyHours;
    onSave: (hours: WeeklyHours) => Promise<void>;
    isSaving: boolean;
}) {
    const [hours, setHours] = useState<WeeklyHours>(initialHours);
    const daysOfWeek: (keyof WeeklyHours)[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

    // Actualizar estado si los datos iniciales cambian
    useEffect(() => {
        setHours(initialHours);
    }, [initialHours]);

    const handleDayChange = (day: keyof WeeklyHours, field: keyof DayHours, value: string | boolean) => {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(hours);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Horario Semanal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {daysOfWeek.map(day => (
                        <div key={day} className="grid grid-cols-4 items-center gap-4 border-b pb-2 last:border-b-0">
                            <Label className="capitalize col-span-1">{day}</Label>
                            <div className="flex items-center space-x-2 col-span-1">
                                <Switch 
                                    id={`${day}-isOpen`} 
                                    checked={hours[day].isOpen}
                                    onCheckedChange={(checked) => handleDayChange(day, 'isOpen', checked)}
                                    disabled={isSaving}
                                />
                                <Label htmlFor={`${day}-isOpen`}>{hours[day].isOpen ? 'Abierto' : 'Cerrado'}</Label>
                            </div>
                            <Input 
                                type="time" 
                                value={hours[day].open || ''} 
                                onChange={(e) => handleDayChange(day, 'open', e.target.value)}
                                disabled={!hours[day].isOpen || isSaving}
                                className="col-span-1"
                            />
                            <Input 
                                type="time" 
                                value={hours[day].close || ''} 
                                onChange={(e) => handleDayChange(day, 'close', e.target.value)}
                                disabled={!hours[day].isOpen || isSaving}
                                className="col-span-1"
                            />
                        </div>
                    ))}
                    <div className="flex justify-end pt-4">
                         <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando Horario...' : 'Guardar Horario'}</Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}

// --- Componente para Gestionar Promociones ---
function PromotionsForm({ initialPromotions, onSave, isSaving }: {
    initialPromotions: Promotion[];
    onSave: (promotions: Promotion[]) => Promise<void>;
    isSaving: boolean;
}) {
    const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);

    useEffect(() => {
        setPromotions(initialPromotions);
    }, [initialPromotions]);

    const handlePromoChange = (index: number, field: keyof Promotion, value: string | boolean) => {
        setPromotions(prev => prev.map((promo, i) => 
            i === index ? { ...promo, [field]: value } : promo
        ));
    };

    const handleAddPromo = () => {
        // Añadir promo con ID temporal único (ej. timestamp)
        const newId = `promo_${Date.now()}`;
        setPromotions(prev => [...prev, { id: newId, description: '', isActive: true }]);
    };

    const handleRemovePromo = (index: number) => {
        setPromotions(prev => prev.filter((_, i) => i !== index));
    };

     const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Filtrar promos sin descripción antes de guardar?
        const validPromos = promotions.filter(p => p.description.trim() !== '');
        onSave(validPromos);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                 <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Promociones Activas</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddPromo} disabled={isSaving}>+ Agregar Promo</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {promotions.length === 0 && <p className="text-muted-foreground">No hay promociones activas.</p>}
                    {promotions.map((promo, index) => (
                        <div key={promo.id} className="flex items-start gap-2 border p-3 rounded">
                           <div className="flex-1 space-y-2">
                                <Label htmlFor={`promo-desc-${index}`}>Descripción</Label>
                                <Textarea 
                                    id={`promo-desc-${index}`} 
                                    value={promo.description}
                                    onChange={(e) => handlePromoChange(index, 'description', e.target.value)}
                                    required
                                    disabled={isSaving}
                                    rows={2}
                                />
                                <div className="flex items-center gap-4">
                                     <div className="flex items-center space-x-2">
                                        <Switch 
                                            id={`promo-active-${index}`}
                                            checked={promo.isActive}
                                            onCheckedChange={(checked) => handlePromoChange(index, 'isActive', checked)}
                                             disabled={isSaving}
                                        />
                                        <Label htmlFor={`promo-active-${index}`}>Activa</Label>
                                    </div>
                                     {/* TODO: Añadir inputs para fechas startDate / endDate si se necesitan */}
                                </div>
                            </div>
                             <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePromo(index)} disabled={isSaving} className="text-destructive">
                                 <Trash2 className="h-4 w-4"/>
                             </Button>
                        </div>
                    ))}
                     <div className="flex justify-end pt-4">
                         <Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando Promos...' : 'Guardar Promociones'}</Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}


// --- Componente Principal de la Página ---
export default function AdminHorariosPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, startSavingTransition] = useTransition();

    // Cargar configuración al montar
    useEffect(() => {
        async function loadSettings() {
            setIsLoading(true);
            try {
                const fetchedSettings = await getSiteSettings();
                setSettings(fetchedSettings); 
            } catch (error: any) {
                toast({ title: "Error al cargar configuración", description: error.message, variant: "destructive" });
            }
            setIsLoading(false);
        }
        loadSettings();
    }, [toast]);

    // Manejador para guardar toda la configuración
    const handleSaveSettings = async (dataToSave: { weeklyHours: WeeklyHours, promotions: Promotion[] }) => {
        startSavingTransition(async () => {
            const result = await updateSiteSettings(dataToSave);
            if (result.success) {
                toast({ title: "Éxito", description: result.message });
                 // Actualizar estado local si es necesario, aunque revalidate debería bastar
                // setSettings(prev => prev ? {...prev, ...dataToSave} : null);
            } else {
                toast({ title: "Error al guardar", description: result.message + (result.errors ? ` (${JSON.stringify(result.errors)})` : ''), variant: "destructive" });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 space-y-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (!settings) {
         return <div className="container mx-auto p-4"><p>No se pudo cargar la configuración. Intenta de nuevo.</p></div>;
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-3xl font-bold">Gestión de Horarios y Promociones</h1>
            
            <WeeklyHoursForm 
                initialHours={settings.weeklyHours}
                onSave={(hours) => handleSaveSettings({ ...settings, weeklyHours: hours })} 
                isSaving={isSaving}
            />

            <PromotionsForm
                 initialPromotions={settings.promotions}
                 onSave={(promos) => handleSaveSettings({ ...settings, promotions: promos })}
                 isSaving={isSaving}
            />

        </div>
    );
}
