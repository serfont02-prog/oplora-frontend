'use client';

// ⭐ Carga de contenido con "esqueleto": mientras llega un apunte o un tema se dibuja la forma de
// la pantalla (cabecera, título, tarjetas y líneas de texto) en gris suave con un brillo que pasa.
// Es lo que usan las apps profesionales: parece que el contenido va apareciendo, no una espera.
// Sin colores propios (usa los de la tarjeta), así que vale en claro y en oscuro.

type Variante = 'apunte' | 'tema' | 'ficha' | 'resultado';

export default function CargaEsqueleto({
  variante,
  fondo,
  texto = 'Cargando',
}: {
  variante: Variante;
  fondo?: string;
  /** Solo para lectores de pantalla. */
  texto?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-label={texto} style={{ minHeight: '100vh', background: fondo }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Cabecera: botón volver + título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <div className="oe-bloque" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="oe-bloque" style={{ width: '32%', height: 10 }} />
            <div className="oe-bloque" style={{ width: '78%', height: 16 }} />
          </div>
        </div>

        {variante === 'tema' ? <Tema /> : variante === 'ficha' ? <Ficha /> : variante === 'resultado' ? <Resultado /> : <Apunte />}
      </div>
    </div>
  );
}

function Lineas({ anchos, alto = 11, hueco = 10 }: { anchos: number[]; alto?: number; hueco?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: hueco }}>
      {anchos.map((w, i) => <div key={i} className="oe-bloque" style={{ width: `${w}%`, height: alto }} />)}
    </div>
  );
}

function Tarjeta({ children, padding = 16 }: { children: React.ReactNode; padding?: number }) {
  return (
    <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: 'var(--c-sombra)', padding }}>{children}</div>
  );
}

function Apunte() {
  return (
    <>
      {/* Barra de lectura (audio, tamaño de letra) */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[44, 90, 70, 52].map((w, i) => <div key={i} className="oe-bloque" style={{ width: w, height: 34, borderRadius: 999 }} />)}
      </div>
      <Tarjeta padding={20}>
        <div className="oe-bloque" style={{ width: '62%', height: 18, marginBottom: 18 }} />
        <Lineas anchos={[100, 96, 99, 92, 97, 64]} />
        <div className="oe-bloque" style={{ width: '45%', height: 15, margin: '26px 0 16px' }} />
        <Lineas anchos={[98, 100, 94, 88]} />
        <div className="oe-bloque" style={{ width: '100%', height: 64, borderRadius: 12, marginTop: 22 }} />
        <div style={{ marginTop: 22 }}><Lineas anchos={[100, 95, 70]} /></div>
      </Tarjeta>
    </>
  );
}

function Tema() {
  return (
    <>
      {/* Pestañas */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[92, 84, 96].map((w, i) => <div key={i} className="oe-bloque" style={{ width: w, height: 34, borderRadius: 999 }} />)}
      </div>
      {/* Progreso */}
      <Tarjeta>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="oe-bloque" style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}><Lineas anchos={[55, 85]} alto={12} /></div>
        </div>
        <div className="oe-bloque" style={{ width: '100%', height: 8, borderRadius: 999, marginTop: 16 }} />
      </Tarjeta>
      {/* Material / actividades */}
      <Tarjeta padding={6}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px' }}>
            <div className="oe-bloque" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1 }}><Lineas anchos={[i % 2 ? 52 : 68, i % 2 ? 80 : 42]} alto={10} hueco={8} /></div>
          </div>
        ))}
      </Tarjeta>
    </>
  );
}

function Ficha() {
  return (
    <>
      {/* Tarjeta principal (datos destacados) */}
      <Tarjeta padding={18}>
        <div className="oe-bloque" style={{ width: '55%', height: 16, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="oe-bloque" style={{ width: '70%', height: 18 }} />
              <div className="oe-bloque" style={{ width: '90%', height: 9 }} />
            </div>
          ))}
        </div>
      </Tarjeta>
      {/* Bloques de información */}
      {[0, 1].map((t) => (
        <Tarjeta key={t} padding={18}>
          <div className="oe-bloque" style={{ width: t ? '38%' : '46%', height: 14, marginBottom: 14 }} />
          <Lineas anchos={t ? [96, 88, 60] : [100, 92, 97, 70]} alto={10} />
        </Tarjeta>
      ))}
      <div className="oe-bloque" style={{ width: '100%', height: 46, borderRadius: 14 }} />
    </>
  );
}

function Resultado() {
  return (
    <>
      <Tarjeta padding={22}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div className="oe-bloque" style={{ width: 120, height: 120, borderRadius: '50%' }} />
          <div className="oe-bloque" style={{ width: '50%', height: 16 }} />
          <div className="oe-bloque" style={{ width: '70%', height: 10 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20 }}>
          {[0, 1, 2].map((i) => <div key={i} className="oe-bloque" style={{ height: 54, borderRadius: 12 }} />)}
        </div>
      </Tarjeta>
      <Tarjeta padding={16}><Lineas anchos={[60, 90]} alto={11} /></Tarjeta>
      <div className="oe-bloque" style={{ width: '100%', height: 46, borderRadius: 14 }} />
    </>
  );
}

const CSS = `
@keyframes oe-brillo { from { background-position: 150% 0; } to { background-position: -50% 0; } }
@keyframes oe-entrar { from { opacity: 0; } to { opacity: 1; } }
.oe-bloque {
  border-radius: 6px;
  /* gris que se adapta al fondo (más oscuro en claro, más claro en oscuro) */
  background-color: var(--c-superficie-2);
  background-color: color-mix(in srgb, var(--c-texto, #0f172a) 8%, transparent);
  background-image: linear-gradient(90deg, transparent 0%, var(--c-esqueleto-brillo, rgba(255,255,255,.55)) 50%, transparent 100%);
  background-size: 50% 100%;
  background-repeat: no-repeat;
  animation: oe-brillo 1.4s ease-in-out infinite, oe-entrar .25s ease both;
}
@media (prefers-reduced-motion: reduce) { .oe-bloque { animation: none; background-image: none; } }
`;
