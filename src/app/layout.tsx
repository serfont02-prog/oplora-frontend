import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { SCRIPT_TEMA } from '@/lib/tema';

export const metadata: Metadata = {
  title: 'OPLORA',
  description: 'Entrenamiento inteligente para oposiciones',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ⭐ suppressHydrationWarning: el script de tema pone data-tema en <html> antes de que cargue React
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* ⭐ Aplica el tema (claro/oscuro) antes de pintar, sin destello blanco */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>
          <Providers>
            {children}
          </Providers>
      </body>
    </html>
  );
}
