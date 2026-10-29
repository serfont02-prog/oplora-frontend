import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { SCRIPT_TEMA } from '@/lib/tema';

const URL_WEB = process.env.NEXT_PUBLIC_SITE_URL || 'https://oplora-frontend.vercel.app';

// ⭐ Título, descripción, imagen al compartir (Open Graph) e icono propios. Antes el título era
// "OPLORA" en todas las pantallas, el icono el de Next.js y los enlaces se compartían sin vista previa.
export const metadata: Metadata = {
  metadataBase: new URL(URL_WEB),
  title: { default: 'Oplora · Entrena tu oposición', template: '%s · Oplora' },
  description: 'Tests, temario, flashcards, duelos y Liga para preparar tu oposición cada día.',
  applicationName: 'Oplora',
  appleWebApp: { capable: true, title: 'Oplora', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Oplora',
    title: 'Oplora · Entrena tu oposición',
    description: 'Tests, temario, flashcards, duelos y Liga para preparar tu oposición cada día.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oplora · Entrena tu oposición',
    description: 'Tests, temario, flashcards, duelos y Liga para preparar tu oposición cada día.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EAF0FF' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1626' },
  ],
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
