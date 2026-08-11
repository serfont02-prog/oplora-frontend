'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Users, BarChart2, BookOpen, Home, ChevronRight, LogOut, Newspaper, Settings,Layers, BookMarked  } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Inicio', icon: Home, exact: true },
  { href: '/admin/oposiciones', label: 'Oposiciones', icon: FileText },
  { href: '/admin/leyes', label: 'Leyes', icon: BookOpen },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/estadisticas', label: 'Estadísticas', icon: BarChart2 },
  { href: '/admin/boe', label: 'BOE', icon: Newspaper },
  { href: '/admin/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/admin/apuntes', label: 'Apuntes OPLORA', icon: BookMarked },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f9fafb' }}>

      {/* Sidebar */}
      <div style={{ width: '220px', background: '#111827', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', background: '#3b82f6', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
              📚
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>OpositaAI</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Panel Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.75rem' }}>
          <div style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', paddingLeft: '8px' }}>
            General
          </div>
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 10px', borderRadius: '8px', marginBottom: '2px',
                  fontSize: '13px', fontWeight: active ? 500 : 400,
                  color: active ? 'white' : 'rgba(255,255,255,0.5)',
                  background: active ? 'rgba(255,255,255,0.1)' : 'none',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
              >
                <Icon size={15} />
                {label}
                {active && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => router.push('/app/dashboard')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <LogOut size={14} />
            Ir a la app
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ height: '52px', background: 'white', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9ca3af' }}>
            {pathname.split('/').filter(Boolean).map((segment, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {i > 0 && <ChevronRight size={11} />}
                <span style={{ color: i === arr.length - 1 ? '#111827' : '#9ca3af', fontWeight: i === arr.length - 1 ? 500 : 400, textTransform: 'capitalize' }}>
                  {segment === 'admin' ? 'Admin' : segment}
                </span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: 'white' }}>
              A
            </div>
          </div>
        </div>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}