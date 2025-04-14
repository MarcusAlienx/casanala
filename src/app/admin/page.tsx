'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { RoleGuard } from '@/components/RoleGuard'; // Importar RoleGuard

// Placeholder sections data
const adminSections = [
  { title: "Gestión de Menú", href: "/admin/menu", description: "Agregar, editar o eliminar platillos y categorías.", roles: ['admin'] },
  { title: "Control de Inventario", href: "/admin/inventario", description: "Administrar ingredientes y stock.", roles: ['admin'] },
  { title: "Pedidos para Cocina", href: "/admin/cocina", description: "Ver y gestionar pedidos entrantes para la cocina.", roles: ['admin', 'cocina'] },
  { title: "Pedidos a Domicilio", href: "/admin/domicilio", description: "Ver y gestionar pedidos para entrega.", roles: ['admin', 'mesero'] }, // Ejemplo: Admin y Mesero pueden ver
  { title: "Pedidos para Recoger", href: "/admin/recoger", description: "Ver y gestionar pedidos para recoger en tienda.", roles: ['admin', 'mesero'] }, // Ejemplo: Admin y Mesero pueden ver
  { title: "Gestión de Horarios", href: "/admin/horarios", description: "Actualizar horarios de apertura y promociones.", roles: ['admin'] },
];

export default function AdminDashboard() {
    // Podríamos usar useAuth aquí para obtener el rol y filtrar las secciones visibles
    // const { user } = useAuth(); 
    // const userRole = user?.role;
    // const visibleSections = adminSections.filter(section => section.roles.includes(userRole || ''));
    // Pero por simplicidad inicial, mostraremos todas y dejaremos que RoleGuard en cada página haga la protección.

  return (
      <RoleGuard allowedRoles={['admin', 'cocina', 'mesero']}> {/* Permitir acceso a todos los roles de empleado */}
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Panel de Administración - Casa Nala</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Usar `adminSections` o `visibleSections` si se filtra arriba */} 
                {adminSections.map((section) => (
                  <Link href={section.href} key={section.title} legacyBehavior>
                    <a className="block hover:no-underline">
                      <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full">
                        <CardHeader>
                          <CardTitle>{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{section.description}</p>
                        </CardContent>
                      </Card>
                    </a>
                  </Link>
                ))}
            </div>
        </div>
     </RoleGuard>
  );
}
