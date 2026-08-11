'use client';

type Props = {
  total: number;
};

export default function CargandoTest({ total }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '3px solid #f3f4f6',
          borderTopColor: '#111827',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />

      <div
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: '#111827',
        }}
      >
        Preparando test...
      </div>

      <div
        style={{
          fontSize: '13px',
          color: '#9ca3af',
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        Seleccionando {total} preguntas
        <br />
        Esto puede tardar unos segundos
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}