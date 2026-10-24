'use client';

type TipoTest = 'oposicion' | 'normativa' | 'tema';

type Props = {
  estado: string;

  tipoTest: TipoTest;
  setTipoTest: (v: TipoTest) => void;

  numPreguntas: number;
  setNumPreguntas: (v: number) => void;

  mostrarCustom: boolean;
  setMostrarCustom: (v: boolean) => void;

  numCustom: string;
  setNumCustom: (v: string) => void;

  total: number;

  generarTest: () => void;
};

export function ConfiguracionTest({
  estado,
  tipoTest,
  setTipoTest,
  numPreguntas,
  setNumPreguntas,
  mostrarCustom,
  setMostrarCustom,
  numCustom,
  setNumCustom,
  total,
  generarTest,
}: Props) {

  if (estado !== 'configurando') {
    return null;
  }

  return (
    <div>

      {/* Tipo de test */}
      <div
        style={{
          background: 'var(--c-superficie)',
          border: '1px solid var(--hx-f3f4f6)',
          borderRadius: '20px',
          padding: '1rem',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--hx-9ca3af)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px',
          }}
        >
          Tipo de test
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            {
              key: 'oposicion',
              icon: '🎯',
              label: 'Oposición',
            },
            {
              key: 'normativa',
              icon: '📖',
              label: 'Normativa',
            },
            {
              key: 'tema',
              icon: '📋',
              label: 'Temas',
            },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setTipoTest(key as TipoTest)}
              style={{
                flex: 1,
                padding: '14px 10px',
                borderRadius: '16px',
                cursor: 'pointer',
                border:
                  tipoTest === key
                    ? '2px solid var(--hx-111827)'
                    : '1px solid var(--hx-e5e7eb)',
                background:
                  tipoTest === key
                    ? 'var(--hx-f9fafb)'
                    : 'var(--c-superficie)',
                transition: '0.2s',
              }}
            >
              <div
                style={{
                  fontSize: '22px',
                  marginBottom: '6px',
                }}
              >
                {icon}
              </div>

              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--hx-111827)',
                }}
              >
                {label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Número preguntas */}
      <div
        style={{
          background: 'var(--c-superficie)',
          border: '1px solid var(--hx-f3f4f6)',
          borderRadius: '20px',
          padding: '1rem',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--hx-9ca3af)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px',
          }}
        >
          Número de preguntas
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: mostrarCustom ? '10px' : '0',
          }}
        >
          {[10, 20, 50].map((n) => (
            <button
              key={n}
              onClick={() => {
                setNumPreguntas(n);
                setMostrarCustom(false);
              }}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                border:
                  !mostrarCustom && numPreguntas === n
                    ? 'none'
                    : '1px solid var(--hx-e5e7eb)',
                background:
                  !mostrarCustom && numPreguntas === n
                    ? 'var(--hxbg-111827)'
                    : 'var(--c-superficie)',
                color:
                  !mostrarCustom && numPreguntas === n
                    ? 'var(--c-primario-texto)'
                    : 'var(--hx-6b7280)',
              }}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() =>
              setMostrarCustom(!mostrarCustom)
            }
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: mostrarCustom
                ? 'none'
                : '1px solid var(--hx-e5e7eb)',
              background: mostrarCustom
                ? 'var(--hxbg-111827)'
                : 'var(--c-superficie)',
              color: mostrarCustom
                ? 'var(--c-primario-texto)'
                : 'var(--hx-6b7280)',
            }}
          >
            Otro
          </button>
        </div>

        {mostrarCustom && (
          <input
            type="number"
            min="1"
            max="100"
            placeholder="Número de preguntas"
            value={numCustom}
            onChange={(e) =>
              setNumCustom(e.target.value)
            }
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid var(--hx-e5e7eb)',
              borderRadius: '14px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>

      {/* Info */}
      <div
        style={{
          background: 'var(--hx-f9fafb)',
          border: '1px solid var(--hx-f3f4f6)',
          borderRadius: '16px',
          padding: '12px 14px',
          marginBottom: '16px',
          display: 'flex',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '16px' }}>
          💡
        </span>

        <div
          style={{
            fontSize: '12px',
            color: 'var(--hx-6b7280)',
            lineHeight: 1.5,
          }}
        >
          Las preguntas se generan desde el banco
          oficial de preguntas de la oposición.
        </div>
      </div>

      {/* Botón */}
      <button
        onClick={generarTest}
        style={{
          width: '100%',
          padding: '16px',
          background: 'var(--hxbg-111827)',
          color: 'var(--c-primario-texto)',
          border: 'none',
          borderRadius: '18px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ▶ Empezar test · {total} preguntas
      </button>

    </div>
  );
}