'use client';

import React, { useState, useMemo, useEffect, useTransition } from 'react'; // Added useEffect, useTransition
import dynamic from 'next/dynamic';
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import MenuList from '../components/MenuList';
import { MenuItemProps } from '../components/MenuItem';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckoutForm } from '@/components/CheckoutForm'; // Import CheckoutForm
import { createOrder, CustomerInfo } from '@/app/admin/pedidos/actions'; // Import createOrder action
import { getMenuItems } from "@/app/admin/menu/actions"; // Import action to fetch menu

// Dynamically import the map component
const DynamicMap = dynamic(() => import('../components/GeofencingMap'), {
  ssr: false,
});

// --- Type Definitions ---
interface ChatMessage { text: string; sender: 'user' | 'bot'; }
interface CartItem extends MenuItemProps { quantity: number; }
// --- End Type Definitions ---

// --- Chatbot Component (Unchanged - Assume it exists as before) ---
function Chatbot({ messages, onSendMessage, isLoading }: { messages: ChatMessage[]; onSendMessage: (newMessage: string) => void; isLoading: boolean }) { /* ... */ }
// --- End Chatbot Component ---

// --- Cart Display Component (Updated) ---
function CartDisplay({ cartItems, onUpdateQuantity, onRemoveItem, total, onCheckout }: {
     cartItems: CartItem[]; 
     onUpdateQuantity: (id: string | number, quantity: number) => void; 
     onRemoveItem: (id: string | number) => void; 
     total: number; 
     onCheckout: () => void; // Add checkout handler prop
 }) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Tu Pedido</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100%-60px)] p-4"> 
          {cartItems.length === 0 ? (
            <p className="text-muted-foreground text-center">Tu pedido está vacío.</p>
          ) : (
            <ul className="space-y-2">
              {cartItems.map(item => (
                <li key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</Button>
                    <span>{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>+</Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onRemoveItem(item.id)}>X</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t p-4">
        <p className="font-semibold">Total:</p>
        <p className="font-bold text-lg">${total.toFixed(2)} MXN</p>
      </CardFooter>
      {cartItems.length > 0 && (
          <div className="p-4 pt-0">
             {/* Updated Button to call onCheckout */} 
            <Button className="w-full" onClick={onCheckout}> 
              Proceder al Pago
            </Button>
          </div>
      )}
    </Card>
  );
}
// --- End Cart Display Component ---


export default function Home() {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItemProps[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([{ text: "¡Bienvenido a Casa Nala! ¿Cómo puedo ayudarte?", sender: "bot" }]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]); 
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false); // State for checkout modal
  const [isPlacingOrder, startPlacingOrderTransition] = useTransition(); // State for order submission

  // Fetch menu items from Firestore on mount
   useEffect(() => {
        async function loadMenu() {
            setIsLoadingMenu(true);
            try {
                const items = await getMenuItems(); // Use the server action
                setMenuItems(items);
            } catch (error: any) {
                toast({ title: "Error al cargar menú", description: "No se pudo obtener el menú desde la base de datos.", variant: "destructive" });
            }
            setIsLoadingMenu(false);
        }
        loadMenu();
    }, [toast]);

  // --- Cart Handlers (Unchanged) ---
  const handleAddToCart = (itemToAdd: MenuItemProps) => { /* ... */ };
  const handleUpdateCartQuantity = (id: string | number, quantity: number) => { /* ... */ };
  const handleRemoveFromCart = (id: string | number) => { /* ... */ };
  const cartTotal = useMemo(() => { /* ... */ }, [cartItems]);
  // --- End Cart Handlers ---

  // --- Checkout Handlers ---
  const handleOpenCheckout = () => setIsCheckoutOpen(true);
  const handleCloseCheckout = () => setIsCheckoutOpen(false);

  const handlePlaceOrder = async (customerData: CustomerInfo, orderType: 'recoger' | 'domicilio') => {
     startPlacingOrderTransition(async () => {
         const orderData = {
             items: cartItems.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })), // Map cart items
             total: cartTotal,
             type: orderType,
             customer: customerData,
         };
         const result = await createOrder(orderData);

         if (result.success) {
             toast({ title: "Pedido Enviado", description: `¡Gracias por tu pedido! Tu ID de pedido es ${result.orderId?.substring(0, 6)}...` });
             setCartItems([]); // Clear the cart
             handleCloseCheckout(); // Close the modal
         } else {
             console.error("Order creation error:", result.errors);
             toast({ 
                 title: "Error al Enviar Pedido", 
                 description: result.message + (result.errors ? ` (${Object.keys(result.errors).join(', ')})` : ''), 
                 variant: "destructive" 
            });
             // Keep modal open if there are errors?
         }
     });
  };
  // --- End Checkout Handlers ---

  // --- Chatbot Handler (Unchanged) ---
  const handleSendMessage = async (newMessageText: string) => { /* ... */ };
  // --- End Chatbot Handler ---

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 p-4"> 
          {/* Menu Section */}
          <section className="border rounded p-4 flex flex-col gap-4 md:col-span-2">
             <div className="flex justify-between items-center">
               <h2 className="text-2xl font-semibold">Menú</h2>
             </div>
            <ScrollArea className="flex-1">
                {isLoadingMenu ? (
                    <p>Cargando menú...</p> // TODO: Add skeleton loader for menu
                ) : (
                    <MenuList
                        items={menuItems}
                        onAddToCart={handleAddToCart}
                    />
                )}
            </ScrollArea>
          </section>

          {/* Right Column */}
          <section className="flex flex-col gap-4">
             {/* Cart Section */} 
             <CartDisplay
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveFromCart}
                total={cartTotal}
                onCheckout={handleOpenCheckout} // Pass handler to open modal
             />
             {/* Map Section */} 
             <div className="border rounded p-4 flex-1 flex flex-col">
               {/* ... Map content ... */} 
             </div>
             {/* Chatbot Section */} 
             <div className="border rounded p-4">
              {/* ... Chatbot component ... */}
             </div>
          </section>
        </main>

        <footer className="p-4 border-t text-center text-sm text-muted-foreground">
          Casa Nala &copy; {new Date().getFullYear()}
        </footer>
        <Toaster />

        {/* Checkout Modal */} 
        {isCheckoutOpen && (
            <CheckoutForm 
                onClose={handleCloseCheckout}
                onSubmit={handlePlaceOrder} 
                isSubmitting={isPlacingOrder}
            />
        )}
      </div>
    </SidebarProvider>
  );
}

// --- Re-include necessary unchanged components/handlers --- 
// function Chatbot(...) { ... }
// Home.handleAddToCart = (...) => { ... }
// Home.handleUpdateCartQuantity = (...) => { ... }
// Home.handleRemoveFromCart = (...) => { ... }
// Home.cartTotal = useMemo(...) => { ... }
// Home.handleSendMessage = async (...) => { ... } 
// Make sure these functions are correctly defined within or outside the Home component as needed.
