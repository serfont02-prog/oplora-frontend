'use client';

import { Bell, BookOpen, ClipboardCheck, Flame, Home } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

type AppFooterProps = {
  oposicionId?: string;
};

const items = [
  { label: 'Inicio', path: '/app/dashboard', icon: Home, color: '#1f7cff' },
  { label: 'Estudiar', path: '/app/catalogo', icon: BookOpen, color: '#a9691f' },
  { label: 'Retos', path: '/app/retos', icon: Flame, color: '#c24135' },
  { label: 'Practicar', path: '/app/entrenamiento', icon: ClipboardCheck, color: '#0ea5e9' },
  { label: 'Alertas', path: '/app/alertas', icon: Bell, color: '#b45309' },
];

export default function AppFooter({ oposicionId }: AppFooterProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <footer
      style={{
        position: 'fixed',
        right: 0,
        bottom: 0,
        left: 0,
        minHeight: 66,
        padding: '8px 10px calc(8px + env(safe-area-inset-bottom))',
        background: 'rgba(255, 253, 248, 0.96)',
        borderTop: '1px solid var(--op-color-border)',
        boxShadow: '0 -8px 22px rgba(13, 27, 42, 0.08)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        zIndex: 50,
      }}
      aria-label="Navegacion principal"
    >
      {items.map(({ label, path, icon: Icon, color }) => {
        const targetPath =
          label === 'Estudiar' && oposicionId ? `/app/oposicion/${oposicionId}` : path;
        const active = pathname === path || (label === 'Estudiar' && pathname.startsWith('/app/tema'));

        return (
          <button
            key={label}
            type="button"
            className="op-focus-ring"
            onClick={() => router.push(targetPath)}
            aria-current={active ? 'page' : undefined}
            style={{
              minWidth: 0,
              border: 0,
              borderRadius: 'var(--op-radius-md)',
              background: active ? 'var(--op-color-primary-soft)' : 'transparent',
              color: active ? color : 'var(--op-color-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '7px 4px',
              cursor: 'pointer',
            }}
          >
            <Icon size={21} strokeWidth={active ? 2.5 : 2.1} />
            <span
              style={{
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 11,
                lineHeight: 1.1,
                fontWeight: active ? 800 : 650,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </footer>
  );
}
