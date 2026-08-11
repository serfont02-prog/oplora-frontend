'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function SolicitarOposicionPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', administracion: '', email: '', notas: '' });
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = () => {
    if (!form.nombre || !form.email) return;
    // Aquí irá la llamada a la API cuando implementemos el backend
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #f3f4f6', padding: '2.5rem', maxWidth: '400px', width: '100%', margin: '0 1rem', textAlign: 'center' }}>
          <CheckCircle size={40} color="#15803d" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>¡Solicitud enviada!</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '1.5rem' }}>
            Te enviaremos un email a <strong>{form.email}</strong> en cuanto la oposición esté disponible en la plataforma.
          </div>
          <button
            onClick={() => router.push('/app/catalogo')}
            style={{ width: '100%', padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #f3f4f6', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.push('/app/catalogo')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Catálogo
        </button>
        <span style={{ color: '#e5e7eb' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Solicitar oposición</span>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '6px' }}>Solicitar oposición</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2rem' }}>
          Dinos qué oposición necesitas y te avisamos cuando esté lista.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '5px' }}>
              Nombre de la oposición *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Técnico Hacienda · Estado"
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '5px' }}>
              Administración convocante
            </label>
            <input
              type="text"
              value={form.administracion}
              onChange={(e) => setForm({ ...form, administracion: e.target.value })}
              placeholder="Ej: Junta de Andalucía, AGE, Ayuntamiento de..."
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '5px' }}>
              Tu email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@email.com"
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '5px' }}>
              Información adicional
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              placeholder="Convocatoria reciente, enlace BOE, cualquier detalle útil..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.nombre || !form.email}
            style={{ width: '100%', padding: '12px', background: !form.nombre || !form.email ? '#d1d5db' : '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: !form.nombre || !form.email ? 'not-allowed' : 'pointer' }}
          >
            Enviar solicitud
          </button>
        </div>
      </div>
    </div>
  );
}