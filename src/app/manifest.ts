import type { MetadataRoute } from 'next';

// ⭐ Manifest: permite "Añadir a pantalla de inicio" con el icono y el nombre de Oplora,
// abriéndose a pantalla completa como una app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Oplora · Entrena tu oposición',
    short_name: 'Oplora',
    description: 'Tests, temario, flashcards, duelos y Liga para preparar tu oposición cada día.',
    start_url: '/app/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#EAF0FF',
    theme_color: '#EAF0FF',
    lang: 'es',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
