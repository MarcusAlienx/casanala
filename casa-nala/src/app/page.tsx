"use client";

import Image from "next/image";
import type React from "react";
import { useState, useEffect } from "react";
import { Poiret_One, Amatic_SC } from "next/font/google";

const poiretOne = Poiret_One({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap"
});

const amaticSC = Amatic_SC({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap"
});

// Prevent hydration mismatch by ensuring state is only set on client
function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

// Opciones de entrega
const opcionesEntrega = [
  { id: 'recoger', nombre: 'Recoger en tienda', costo: 0, logo: null },
  { id: 'domicilio', nombre: 'Servicio a Domicilio', costo: 40, logo: null },
  { id: 'rappi', nombre: 'Rappi', costo: 0, logo: '/logos/ubereats-logo.png' },
  { id: 'ubereats', nombre: 'Uber Eats', costo: 0, logo: '/logos/ubereats-logo.png' },
  { id: 'didi', nombre: 'DiDi Food', costo: 0, logo: '/logos/ubereats-logo.png' },
];

const mockMenu = [
  {
    id: 1,
    nombre: "Pozole Rojo",
    precio: 120,
    imagen: "/logo_nala.jpg",
  },
  {
    id: 2,
    nombre: "Taco de Barbacoa",
    precio: 55,
    imagen: "/logo_nala.jpg",
  },
  {
    id: 3,
    nombre: "Quesadilla de Flor de Calabaza",
    precio: 48,
    imagen: "/logo_nala.jpg",
  },
  {
    id: 4,
    nombre: "Tostada de Tinga",
    precio: 52,
    imagen: "/logo_nala.jpg",
  },
  {
    id: 5,
    nombre: "Sopes de Chicharrón",
    precio: 42,
    imagen: "/logo_nala.jpg",
  },
  {
    id: 6,
    nombre: "Agua Fresca de Jamaica",
    precio: 32,
    imagen: "/logo_nala.jpg",
  },
];

type MenuItem = typeof mockMenu[0];
type CarritoItem = MenuItem & { cantidad: number };

export default function Home() {
  const isClient = useIsClient();

  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  const [paso, setPaso] = useState<'menu' | 'datos' | 'confirmacion'>('menu');
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    telefono: '',
    horario: '',
    comentarios: ''
  });

  // Estado para opción de entrega y dirección
  const [opcionEntrega, setOpcionEntrega] = useState<string>('recoger');
  const [direccionEntrega, setDireccionEntrega] = useState({
    calle: '',
    numero: '',
    colonia: '',
    codigoPostal: '',
    referencias: ''
  });

  // Calculador del total del pedido
  const calcularTotal = () => {
    const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    // Agregar costo de entrega si es a domicilio
    const costoEnvio = opcionEntrega === 'domicilio' ? 40 : 0;
    return subtotal + costoEnvio;
  };

  // Corregido para aceptar cualquier objeto con id, nombre, precio, imagen
  const agregar = (platillo: MenuItem) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === platillo.id);
      if (existe) {
        return prev.map((item) =>
          item.id === platillo.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...platillo, cantidad: 1 }];
    });
  };

  const quitar = (platillo: MenuItem) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === platillo.id);
      if (!existe) return prev;
      if (existe.cantidad === 1)
        return prev.filter((item) => item.id !== platillo.id);
      return prev.map((item) =>
        item.id === platillo.id
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      );
    });
  };

  const quitarItemCarrito = (itemId: number) => {
    setCarrito(prev => prev.filter(item => item.id !== itemId));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDatosCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const irAlInicio = () => {
    setPaso('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const continuarAPaso2 = () => {
    if (carrito.length > 0) {
      setPaso('datos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const confirmarPedido = () => {
    // Validar datos básicos
    if (!datosCliente.nombre || !datosCliente.telefono || !datosCliente.horario) {
      return;
    }

    // Si es domicilio, validar campos de dirección
    if (opcionEntrega === 'domicilio') {
      if (!direccionEntrega.calle || !direccionEntrega.numero ||
          !direccionEntrega.colonia || !direccionEntrega.codigoPostal) {
        alert('Por favor completa todos los campos de dirección de entrega');
        return;
      }
    }

    // Continuar con la confirmación
    setPaso('confirmacion');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Aquí se conectaría con la API para enviar el pedido
  };

  const volverAMenu = () => {
    setPaso('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setPaso('menu');
    setDatosCliente({
      nombre: '',
      telefono: '',
      horario: '',
      comentarios: ''
    });
    setOpcionEntrega('recoger');
    setDireccionEntrega({
      calle: '',
      numero: '',
      colonia: '',
      codigoPostal: '',
      referencias: ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Si todavía no estamos en el cliente, mostramos un esqueleto sencillo para evitar errores de hidratación
  if (!isClient) {
    return (
      <main className="min-h-screen bg-[#F5E8D2] flex items-center justify-center">
        <div className="text-[#6C3A3A] text-2xl">Cargando Casa NALA...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5E8D2] pb-24">
      {/* Header */}
      <header className="w-full p-4 flex justify-between items-center bg-[#6C3A3A] text-[#F5E8D2] shadow-md">
        <div className="flex items-center gap-4">
          <Image
            src="/logo_nala.jpg"
            width={60}
            height={60}
            alt="Logo Casa Nala"
            className="rounded-full bg-[#F5E8D2] p-1"
          />
          <div>
            <div className={`text-2xl tracking-wider ${poiretOne.className}`}>CASA NALA</div>
            <div className={`text-sm italic text-[#F5E8D2] font-light leading-none mt-0.5 ${amaticSC.className}`}>
              Comida de México
            </div>
          </div>
        </div>
        <nav className="flex gap-6 text-lg">
          <button
            onClick={irAlInicio}
            className="hover:underline font-medium"
            type="button"
          >
            Menú
          </button>
          <a href="#pedidos" className="hover:underline">
            Pedidos
          </a>
          <a href="#reservas" className="hover:underline">
            Reservaciones
          </a>
          <a href="#admin" className="hover:underline">
            Admin
          </a>
        </nav>
      </header>
      {/* Hero */}
      <section className="bg-[#F5E8D2] flex flex-col items-center text-[#6C3A3A] py-6">
        <Image
          src="/logo_nala.jpg"
          width={160}
          height={160}
          alt="Logo Casa Nala"
          className="rounded bg-[#F5E8D2] p-2 mb-2"
        />
        <div
          className={`mt-2 text-4xl font-light tracking-[0.15em] ${poiretOne.className}`}
        >
          CASA NALA
        </div>
        <div className={`text-xl italic mt-1 text-[#9DA17B] ${amaticSC.className}`}>
          Comida de México
        </div>
      </section>

      {/* Sección de Proceso de Pedido (nuevo) */}
      <section id="pedidos" className="max-w-4xl mx-auto mt-4 px-4">
        <div className="flex justify-center mb-6">
          <div className="w-full max-w-3xl flex items-center justify-between">
            <div className={`flex flex-col items-center ${paso === 'menu' ? 'text-[#6C3A3A] font-bold' : 'text-[#9DA17B]'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-2 ${paso === 'menu' ? 'bg-[#6C3A3A] text-white border-[#6C3A3A]' : 'bg-transparent border-[#9DA17B] text-[#9DA17B]'}`}>1</div>
              <div>Elegir Platillos</div>
            </div>
            <div className={`h-0.5 flex-1 mx-2 ${paso === 'menu' ? 'bg-[#D9D4CE]' : 'bg-[#9DA17B]'}`} />
            <div className={`flex flex-col items-center ${paso === 'datos' ? 'text-[#6C3A3A] font-bold' : 'text-[#9DA17B]'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-2 ${paso === 'datos' ? 'bg-[#6C3A3A] text-white border-[#6C3A3A]' : 'bg-transparent border-[#9DA17B] text-[#9DA17B]'}`}>2</div>
              <div>Tus Datos</div>
            </div>
            <div className={`h-0.5 flex-1 mx-2 ${paso === 'confirmacion' ? 'bg-[#9DA17B]' : 'bg-[#D9D4CE]'}`} />
            <div className={`flex flex-col items-center ${paso === 'confirmacion' ? 'text-[#6C3A3A] font-bold' : 'text-[#9DA17B]'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 border-2 ${paso === 'confirmacion' ? 'bg-[#6C3A3A] text-white border-[#6C3A3A]' : 'bg-transparent border-[#9DA17B] text-[#9DA17B]'}`}>3</div>
              <div>Confirmación</div>
            </div>
          </div>
        </div>
      </section>

      {/* Menú grid - Paso 1 */}
      {paso === 'menu' && (
        <section id="menu" className="max-w-4xl mx-auto px-4">
          <h2 className={`mb-4 text-3xl font-bold text-[#6C3A3A] tracking-wider ${poiretOne.className}`}>
            Menú
          </h2>
          <div className="grid gap-7 sm:grid-cols-2 md:grid-cols-3">
            {mockMenu.map((platillo) => (
              <div
                key={platillo.id}
                className="rounded-xl bg-[#fff] shadow p-4 flex flex-col items-center border border-[#D9D4CE] transition hover:scale-105 hover:shadow-lg"
              >
                <Image
                  src={platillo.imagen}
                  width={120}
                  height={120}
                  alt={platillo.nombre}
                  className="rounded bg-[#F5E8D2] mb-2 object-cover"
                />
                <div className="font-semibold text-lg text-[#6C3A3A] text-center">
                  {platillo.nombre}
                </div>
                <div className="font-bold text-[#D7A556] mt-1 mb-2 text-xl">
                  ${platillo.precio}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 rounded bg-[#9DA17B] text-white font-semibold"
                    onClick={() => agregar(platillo)}
                    aria-label="Agregar"
                    type="button"
                  >
                    +
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-[#d7a556] text-white font-semibold"
                    onClick={() => quitar(platillo)}
                    aria-label="Quitar"
                    type="button"
                  >
                    -
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Paso 2: Formulario de datos del cliente */}
      {paso === 'datos' && (
        <section className="max-w-3xl mx-auto px-6 py-8 bg-white rounded-xl shadow-md mt-4">
          <h2 className={`text-2xl font-bold text-[#6C3A3A] mb-4 ${poiretOne.className}`}>Tus datos para recoger</h2>
          <form className="space-y-4">
            {/* Opción de entrega */}
            <div>
              <label htmlFor="opcionEntrega" className="block text-[#6C3A3A] font-medium mb-1">¿Cómo quieres recibir tu pedido?</label>
              <select
                id="opcionEntrega"
                name="opcionEntrega"
                value={opcionEntrega}
                onChange={e => setOpcionEntrega(e.target.value)}
                className="w-full p-2 border border-[#D9D4CE] rounded bg-[#F5E8D2] focus:outline-none"
              >
                {opcionesEntrega.map(opcion => (
                  <option key={opcion.id} value={opcion.id}>
                    {opcion.nombre} {opcion.costo > 0 ? `(+$${opcion.costo})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Si opción de entrega es domicilio, mostrar campos de dirección */}
            {opcionEntrega === "domicilio" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F5E8D2] p-4 rounded">
                <div>
                  <label className="block text-[#6C3A3A] font-medium mb-1">Calle</label>
                  <input
                    type="text"
                    name="calle"
                    value={direccionEntrega.calle}
                    onChange={e => setDireccionEntrega(prev => ({ ...prev, calle: e.target.value }))}
                    className="w-full p-2 border border-[#D9D4CE] rounded focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6C3A3A] font-medium mb-1">Número</label>
                  <input
                    type="text"
                    name="numero"
                    value={direccionEntrega.numero}
                    onChange={e => setDireccionEntrega(prev => ({ ...prev, numero: e.target.value }))}
                    className="w-full p-2 border border-[#D9D4CE] rounded focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6C3A3A] font-medium mb-1">Colonia</label>
                  <input
                    type="text"
                    name="colonia"
                    value={direccionEntrega.colonia}
                    onChange={e => setDireccionEntrega(prev => ({ ...prev, colonia: e.target.value }))}
                    className="w-full p-2 border border-[#D9D4CE] rounded focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6C3A3A] font-medium mb-1">Código Postal</label>
                  <input
                    type="text"
                    name="codigoPostal"
                    value={direccionEntrega.codigoPostal}
                    onChange={e => setDireccionEntrega(prev => ({ ...prev, codigoPostal: e.target.value }))}
                    className="w-full p-2 border border-[#D9D4CE] rounded focus:outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[#6C3A3A] font-medium mb-1">Referencias</label>
                  <input
                    type="text"
                    name="referencias"
                    value={direccionEntrega.referencias}
                    onChange={e => setDireccionEntrega(prev => ({ ...prev, referencias: e.target.value }))}
                    className="w-full p-2 border border-[#D9D4CE] rounded focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-[#6C3A3A] font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={datosCliente.nombre}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-[#D9D4CE] rounded bg-[#F5E8D2] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-[#6C3A3A] font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={datosCliente.telefono}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-[#D9D4CE] rounded bg-[#F5E8D2] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="horario" className="block text-[#6C3A3A] font-medium mb-1">¿Cuándo recogerás tu pedido?</label>
              <select
                id="horario"
                name="horario"
                value={datosCliente.horario}
                onChange={handleInputChange}
                className="w-full p-2 border border-[#D9D4CE] rounded bg-[#F5E8D2] focus:outline-none"
                required
              >
                <option value="">Selecciona un horario</option>
                <option value="15min">En 15 minutos</option>
                <option value="30min">En 30 minutos</option>
                <option value="1hr">En 1 hora</option>
                <option value="2hrs">En 2 horas</option>
                <option value="custom">Hora específica</option>
              </select>
            </div>

            <div>
              <label htmlFor="comentarios" className="block text-[#6C3A3A] font-medium mb-1">Comentarios adicionales</label>
              <textarea
                id="comentarios"
                name="comentarios"
                value={datosCliente.comentarios}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-2 border border-[#D9D4CE] rounded bg-[#F5E8D2] focus:outline-none"
              />
            </div>

            <div className="mt-4 border-t border-[#D9D4CE] pt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Subtotal</span>
                <span>${carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}</span>
              </div>
              {opcionEntrega === 'domicilio' && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Costo de envío</span>
                  <span>$40</span>
                </div>
              )}
              <div className="flex justify-between items-center font-bold text-[#6C3A3A] border-t border-[#D9D4CE] pt-2">
                <span>Total</span>
                <span>${calcularTotal()}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={volverAMenu}
                className="px-4 py-2 bg-[#D9D4CE] text-[#6C3A3A] rounded font-medium hover:bg-[#D9D4CE]/80 transition"
              >
                Volver al menú
              </button>
              <button
                type="button"
                onClick={confirmarPedido}
                disabled={!datosCliente.nombre || !datosCliente.telefono || !datosCliente.horario}
                className="px-4 py-2 bg-[#6C3A3A] text-white rounded font-medium hover:bg-[#6C3A3A]/90 transition disabled:opacity-50 flex-1"
              >
                Confirmar pedido
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Paso 3: Confirmación */}
      {paso === 'confirmacion' && (
        <section className="max-w-3xl mx-auto px-6 py-8 bg-white rounded-xl shadow-md mt-4 text-center">
          <div className="w-16 h-16 mx-auto bg-[#9DA17B] rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold text-[#6C3A3A] mb-2 ${poiretOne.className}`}>¡Pedido Confirmado!</h2>
          <p className="text-[#9DA17B] mb-6">Gracias {datosCliente.nombre}, hemos recibido tu pedido y estará listo para recoger según lo acordado.</p>

          <div className="bg-[#F5E8D2] p-4 rounded-lg mb-6">
            <h3 className="font-bold text-[#6C3A3A] mb-2">Resumen del pedido:</h3>
            <ul className="space-y-2 text-left">
              {carrito.map(item => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.nombre} x {item.cantidad}</span>
                  <span className="font-bold">${item.precio * item.cantidad}</span>
                </li>
              ))}
              <li className="flex justify-between">
                <span>Subtotal:</span>
                <span>${carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}</span>
              </li>
              {opcionEntrega === 'domicilio' && (
                <li className="flex justify-between">
                  <span>Costo de envío:</span>
                  <span>$40</span>
                </li>
              )}
              <li className="border-t border-[#D9D4CE] pt-2 font-bold flex justify-between">
                <span>Total:</span>
                <span>${calcularTotal()}</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#F5E8D2]/50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-bold text-[#6C3A3A] mb-2">Detalles de recogida:</h3>
            <p><strong>Nombre:</strong> {datosCliente.nombre}</p>
            <p><strong>Teléfono:</strong> {datosCliente.telefono}</p>
            <p><strong>Horario:</strong> {datosCliente.horario}</p>
            {datosCliente.comentarios && (
              <p><strong>Comentarios:</strong> {datosCliente.comentarios}</p>
            )}
            <p><strong>Entrega:</strong> {opcionesEntrega.find(o => o.id === opcionEntrega)?.nombre}</p>
            {opcionEntrega === "domicilio" && (
              <div className="mt-2">
                <p><strong>Dirección:</strong></p>
                <p>
                  {direccionEntrega.calle} {direccionEntrega.numero}, {direccionEntrega.colonia}, CP {direccionEntrega.codigoPostal}
                </p>
                {direccionEntrega.referencias && (
                  <p><strong>Referencias:</strong> {direccionEntrega.referencias}</p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={vaciarCarrito}
            className="px-6 py-2 bg-[#6C3A3A] text-white rounded-lg font-medium hover:bg-[#6C3A3A]/90 transition"
          >
            Volver al inicio
          </button>
        </section>
      )}

      {/* Sección de Reservaciones mejorada */}
      <section id="reservas" className="max-w-2xl mx-auto mt-16 p-6 rounded-xl shadow-lg bg-[#fff] border border-[#D9D4CE] mb-16">
        <h2 className={`text-2xl font-bold text-[#6C3A3A] mb-3 ${poiretOne.className}`}>Reservaciones</h2>
        <p className="text-[#9DA17B] mb-4">Aparta tu mesa en Casa NALA y disfruta de nuestra comida tradicional mexicana en el mejor ambiente.</p>
        <form className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[#6C3A3A] font-medium">Nombre</label>
              <input type="text" className="border border-[#D9D4CE] rounded w-full p-2 mt-1 bg-[#F5E8D2] focus:outline-none" placeholder="Tu nombre" required />
            </div>
            <div>
              <label className="text-[#6C3A3A] font-medium">Teléfono</label>
              <input type="tel" className="border border-[#D9D4CE] rounded w-full p-2 mt-1 bg-[#F5E8D2] focus:outline-none" placeholder="(55) 1234-5678" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[#6C3A3A] font-medium">Personas</label>
              <input type="number" min="1" max="20" className="border border-[#D9D4CE] rounded w-full p-2 mt-1 bg-[#F5E8D2] focus:outline-none" placeholder="2" required />
            </div>
            <div>
              <label className="text-[#6C3A3A] font-medium">Fecha</label>
              <input type="date" className="border border-[#D9D4CE] rounded w-full p-2 mt-1 bg-[#F5E8D2] focus:outline-none" required />
            </div>
            <div>
              <label className="text-[#6C3A3A] font-medium">Hora</label>
              <input type="time" className="border border-[#D9D4CE] rounded w-full p-2 mt-1 bg-[#F5E8D2] focus:outline-none" required />
            </div>
          </div>
          <div>
            <label className="text-[#6C3A3A] font-medium">Ocasión especial</label>
            <select className="border border-[#D9D4CE] rounded w-full p-2 mt-1 bg-[#F5E8D2] focus:outline-none">
              <option value="">Ninguna</option>
              <option value="cumpleaños">Cumpleaños</option>
              <option value="aniversario">Aniversario</option>
              <option value="trabajo">Reunión de trabajo</option>
              <option value="otra">Otra</option>
            </select>
          </div>
          <div>
            <label className="text-[#6C3A3A] font-medium">Comentarios adicionales</label>
            <textarea rows={3} className="border border-[#D9D4CE] rounded w-full p-2 mt-1 bg-[#F5E8D2] focus:outline-none" placeholder="Alguna solicitud especial" />
          </div>
          <button className="bg-[#6C3A3A] text-[#F5E8D2] rounded py-2 px-4 mt-4 font-semibold w-full hover:bg-[#9DA17B] transition" type="button">
            Reservar Mesa
          </button>
        </form>
      </section>

      {/* Área de Entrega a Domicilio */}
      {opcionEntrega === 'domicilio' && paso === 'datos' && (
        <section className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className={`text-xl font-bold text-[#6C3A3A] mb-3 ${poiretOne.className}`}>Área de Entrega</h3>
            <div className="aspect-video bg-[#F5E8D2] mb-4 rounded-lg overflow-hidden relative">
              {/* Imagen del mapa con área límite (puede ser sustituido por Google Maps API) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[#6C3A3A] text-lg">Entregamos en un radio de 5km alrededor de nuestro restaurante.</p>
              </div>
            </div>
            <p className="text-[#9DA17B] mb-4">Por ahora, nuestro servicio a domicilio está limitado a las siguientes colonias: Centro, Reforma, Polanco, Condesa y Roma.</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpcionEntrega('recoger')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-medium"
              >
                Cambiar a Recoger
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-[#6C3A3A] text-white rounded font-medium"
                onClick={() => {
                  document.body.style.overflow = 'auto';
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Sección aplicaciones de entrega */}
      <section className="max-w-3xl mx-auto my-8 p-6 bg-white rounded-xl shadow-lg">
        <h2 className={`text-2xl font-bold text-[#6C3A3A] mb-3 text-center ${poiretOne.className}`}>También disponibles en</h2>
        <p className="text-center text-[#9DA17B] mb-6">Encuentra Casa NALA en las principales plataformas de entrega</p>
        <div className="flex flex-wrap justify-center gap-8">
          <button type="button" className="transition hover:scale-105 border-0 bg-transparent">
            <Image
              src="/logos/ubereats-logo.png"
              width={100}
              height={100}
              alt="Uber Eats"
              className="object-contain"
            />
          </button>
          <button type="button" className="transition hover:scale-105 border-0 bg-transparent">
            <Image
              src="/logos/ubereats-logo.png"
              width={100}
              height={100}
              alt="Rappi"
              className="object-contain"
            />
          </button>
          <button type="button" className="transition hover:scale-105 border-0 bg-transparent">
            <Image
              src="/logos/ubereats-logo.png"
              width={100}
              height={100}
              alt="DiDi Food"
              className="object-contain"
            />
          </button>
        </div>
      </section>

      {/* Carrito flotante - visible solo en paso 1 */}
      {paso === 'menu' && (
        <aside className="fixed bottom-6 right-6 w-72 bg-[#fff] shadow-2xl rounded-xl p-5 border border-[#D9D4CE] z-50">
          <div className="font-bold text-lg text-[#6C3A3A] mb-1">Tu Pedido</div>
          {carrito.length === 0 ? (
            <div className="text-gray-500">Aún no has agregado platillos.</div>
          ) : (
            <ul className="space-y-2 max-h-52 overflow-y-auto">
              {carrito.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center border-b border-[#D9D4CE] pb-1 group relative"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[#6C3A3A]">
                      {item.nombre}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => quitar(item)}
                        className="px-1.5 py-0.5 rounded bg-[#d7a556] text-white text-xs"
                        type="button"
                        aria-label="Quitar uno"
                      >
                        -
                      </button>
                      <span className="text-[#6C3A3A]">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => agregar(item)}
                        className="px-1.5 py-0.5 rounded bg-[#9DA17B] text-white text-xs"
                        type="button"
                        aria-label="Agregar uno"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[#D7A556] font-bold">
                      ${item.precio * item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarItemCarrito(item.id)}
                      className="text-xs text-red-500 mt-1 hover:underline"
                      aria-label="Eliminar del carrito"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 border-t border-[#D9D4CE] pt-2 flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="font-medium">Subtotal</span>
              <span>${carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)}</span>
            </div>
            {opcionEntrega === 'domicilio' && (
              <div className="flex justify-between text-sm">
                <span>Entrega a domicilio</span>
                <span>$40</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold text-[#6C3A3A] border-t border-[#D9D4CE] pt-1 mt-1">
              <span>Total</span>
              <span>${calcularTotal()}</span>
            </div>
          </div>
          <button
            className="mt-4 w-full py-2 rounded bg-[#6C3A3A] text-[#F5E8D2] text-lg font-semibold hover:bg-[#9DA17B] transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={carrito.length === 0}
            type="button"
            onClick={continuarAPaso2}
          >
            Continuar
          </button>
        </aside>
      )}
    </main>
  );
}
