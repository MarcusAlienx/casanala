'use client';

import React, { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { CustomerInfo } from '@/app/admin/pedidos/actions'; // Import type

interface CheckoutFormProps {
    onSubmit: (customerData: CustomerInfo, orderType: 'recoger' | 'domicilio') => Promise<void>; // Async submit
    onClose: () => void;
    isSubmitting: boolean;
}

export function CheckoutForm({ onSubmit, onClose, isSubmitting }: CheckoutFormProps) {
    const [orderType, setOrderType] = useState<'recoger' | 'domicilio'>('recoger');
    const [customerData, setCustomerData] = useState<CustomerInfo>({
        name: '',
        phone: '',
        address: '',
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({}); // Simple error state

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({ ...prev, [name]: value }));
        if(errors[name]) {
            setErrors(prev => ({...prev, [name]: ''})); // Clear error on change
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!customerData.name.trim()) newErrors.name = "El nombre es requerido.";
        if (!customerData.phone.trim()) newErrors.phone = "El teléfono es requerido.";
        else if (!/^[0-9]{10,}$/.test(customerData.phone.replace(/\s+/g, ''))) newErrors.phone = "Ingrese un número de teléfono válido (al menos 10 dígitos)."; // Basic validation
        
        if (orderType === 'domicilio' && !customerData.address?.trim()) {
            newErrors.address = "La dirección es requerida para entrega a domicilio.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        await onSubmit(customerData, orderType);
        // onClose() should be called by the parent component after successful submission
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-semibold mb-4">Confirmar Pedido</h2>

                {/* Order Type Selection */}
                <div>
                    <Label className="mb-2 block">Tipo de Pedido</Label>
                    <RadioGroup defaultValue="recoger" value={orderType} onValueChange={(value: 'recoger' | 'domicilio') => setOrderType(value)} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="recoger" id="r1" />
                            <Label htmlFor="r1">Recoger en Tienda</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="domicilio" id="r2" />
                            <Label htmlFor="r2">Entrega a Domicilio</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Customer Info */}
                <div>
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" name="name" value={customerData.name} onChange={handleChange} required disabled={isSubmitting} />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" type="tel" value={customerData.phone} onChange={handleChange} required disabled={isSubmitting} />
                     {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                {/* Address (Conditional) */}
                {orderType === 'domicilio' && (
                    <div>
                        <Label htmlFor="address">Dirección Completa (Calle, Número, Colonia, Referencias)</Label>
                        <Textarea id="address" name="address" value={customerData.address} onChange={handleChange} required={orderType === 'domicilio'} disabled={isSubmitting} />
                         {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>
                )}

                <div>
                    <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
                    <Textarea id="notes" name="notes" value={customerData.notes} onChange={handleChange} disabled={isSubmitting} />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando Pedido...' : 'Enviar Pedido'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
