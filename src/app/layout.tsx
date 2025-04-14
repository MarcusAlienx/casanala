import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import CasaNalaLogo from '../components/CasaNalaLogo';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from "@/components/ThemeProvider"; 
import { Toaster } from "@/components/ui/toaster"; 
import { LogoutButton } from '@/components/LogoutButton'; // Import LogoutButton

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Casa Nala',
  description: 'Restaurante de Comida Mexicana',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased flex flex-col min-h-screen`}> {/* Ensure body takes full height */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider> 
            <header className="p-4 border-b sticky top-0 bg-background z-10">
              <div className="container mx-auto flex justify-between items-center">
                 <CasaNalaLogo /> 
                 {/* Navigation or User Info could go here */}
                 <LogoutButton /> {/* Add Logout Button here */}
              </div>
            </header>
            <main className="container mx-auto flex-1 py-4 md:py-6">
              {children}
            </main>
            <footer className="p-4 border-t text-center text-sm text-muted-foreground mt-auto"> {/* Push footer down */}
               Casa Nala &copy; {new Date().getFullYear()}
            </footer>
            <Toaster /> 
           </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

