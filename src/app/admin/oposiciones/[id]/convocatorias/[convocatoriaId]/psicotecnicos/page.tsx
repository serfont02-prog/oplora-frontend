'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export default function AdminPsicotecnicosConvocatoriaPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const oposicionId = params.id as string;
  const convocatoriaId = params.convocatoriaId as string;

  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);

  const { data: catalogo = [] } = useQuery({
    queryKey: ['psicotecnicos-catalogo'],
    queryFn: async () => (await api.get('/psicotecnicos/catalogo')).data,
  });

  const { data: config = [], isLoading } = useQuery({
    queryKey: ['psicotecnicos-admin-config', oposicionId],
    queryFn: async () => (await api.get(`/psicotecnicos/admin/config/${oposicionId}`)).data,
  });

  // Por cada tipo: la fila propia de esta convocatoria manda; si no existe,
  // se muestra (de forma informativa) la config por defecto de la oposición.
  const configPorTipo: Record<string, { propia?: any; porDefecto?: any }> = {};
  for (const c of config) {
    const entry = (configPorTipo[c.tipo] ??= {});
    if (c.convocatoria?.id === convocatoriaId) entry.propia = c;
    else if (!c.convocatoria) entry.porDefecto = c;
  }

  const upsert = useMutation({
    mutationFn: async (datos: any) => (await api.post('/psicotecnicos/admin/config', { oposicionId, convocatoriaId, ...datos })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['psicotecnicos-admin-config', oposicionId] }),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => router.push(`/admin/oposiciones/${oposicionId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>Psicotécnicos</span>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Psicotécnicos de esta convocatoria</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
          Activa solo las modalidades que corresponden a esta convocatoria. Si cambia algo en la siguiente, se copiará
          igualmente y aquí solo tocarás lo que cambie (sin afectar a convocatorias anteriores).
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {isLoading ? (
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>
          ) : (
            catalogo.map((t: any) => {
              const entry = configPorTipo[t.tipo];
              const efectiva = entry?.propia ?? entry?.porDefecto;
              const habilitado = efectiva?.habilitado ?? false;
              const esHeredada = !entry?.propia && !!entry?.porDefecto;

              return (
                <div key={t.tipo} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '22px', flexShrink: 0 }}>{t.icono}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{t.nombre}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{t.descripcion}</div>
                      {esHeredada && (
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px', fontStyle: 'italic' }}>
                          Heredado de la config de la oposición
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => upsert.mutate({ tipo: t.tipo, habilitado: !habilitado })}
                      style={{
                        flexShrink: 0, padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none',
                        background: habilitado ? '#111827' : '#f3f4f6',
                        color: habilitado ? 'white' : '#6b7280',
                      }}
                    >
                      {habilitado ? 'Activado' : 'Activar'}
                    </button>

                    {habilitado && (
                      <button
                        onClick={() => setTipoSeleccionado(tipoSeleccionado === t.tipo ? null : t.tipo)}
                        style={{ flexShrink: 0, padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', color: '#374151' }}
                      >
                        {tipoSeleccionado === t.tipo ? 'Cerrar' : 'Preguntas'}
                      </button>
                    )}
                  </div>

                  {tipoSeleccionado === t.tipo && (
                    <div style={{ marginTop: '14px', borderTop: '1px solid #f3f4f6', paddingTop: '14px' }}>
                      <ImportarPreguntasPsicotecnicas
                        oposicionId={oposicionId}
                        convocatoriaId={convocatoriaId}
                        tipo={t.tipo}
                        subtiposSugeridos={t.subtiposSugeridos}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ImportarPreguntasPsicotecnicas({
  oposicionId,
  convocatoriaId,
  tipo,
  subtiposSugeridos,
}: {
  oposicionId: string;
  convocatoriaId: string;
  tipo: string;
  subtiposSugeridos: string[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [resultado, setResultado] = useState<any>(null);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soloEstaConvocatoria, setSoloEstaConvocatoria] = useState(false);

  const handleArchivo = (file: File) => {
    setArchivo(file);
    setResultado(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!Array.isArray(json)) {
          setError('El JSON debe ser un array de preguntas');
          setPreview([]);
          return;
        }
        setPreview(json.slice(0, 3));
      } catch {
        setError('El archivo no es un JSON válido');
        setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const importar = async () => {
    if (!archivo) return;
    setImportando(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          const preguntas = json.map((p: any) => ({ tipo, ...p }));
          const res = await api.post('/psicotecnicos/admin/preguntas/importar', {
            oposicionId,
            convocatoriaId: soloEstaConvocatoria ? convocatoriaId : undefined,
            preguntas,
          });
          setResultado(res.data);
          setArchivo(null);
          setPreview([]);
        } catch {
          setError('Error al importar. Revisa el formato del JSON.');
        } finally {
          setImportando(false);
        }
      };
      reader.readAsText(archivo);
    } catch {
      setError('Error al leer el archivo');
      setImportando(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Formato del JSON</div>
        <pre style={{ fontSize: '10px', color: '#6b7280', margin: 0, overflow: 'auto' }}>
{JSON.stringify([{ subtipo: subtiposSugeridos?.[0] ?? 'general', dificultad: 'medio', enunciado: '...', imagenUrl: null, opciones: ['A', 'B', 'C', 'D'], correcta: 0, explicacion: '...', tiempoRecomendadoSegundos: 60 }], null, 2)}
        </pre>
        {subtiposSugeridos?.length > 0 && (
          <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>
            Subtipos sugeridos: {subtiposSugeridos.join(', ')}
          </div>
        )}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6b7280', cursor: 'pointer' }}>
        <input type="checkbox" checked={soloEstaConvocatoria} onChange={(e) => setSoloEstaConvocatoria(e.target.checked)} />
        Solo para esta convocatoria (si no, quedan disponibles para toda la oposición)
      </label>

      <div
        onClick={() => fileRef.current?.click()}
        style={{ border: '2px dashed #e5e7eb', borderRadius: '10px', padding: '18px', textAlign: 'center', cursor: 'pointer' }}
      >
        {archivo ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FileText size={14} color="#6b7280" />
            <span style={{ fontSize: '12px', color: '#374151' }}>{archivo.name}</span>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Haz clic para subir un JSON de preguntas de {tipo}</div>
        )}
      </div>
      <input ref={fileRef} type="file" accept=".json" onChange={(e) => e.target.files?.[0] && handleArchivo(e.target.files[0])} style={{ display: 'none' }} />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px' }}>
          <AlertCircle size={13} color="#dc2626" />
          <span style={{ fontSize: '12px', color: '#dc2626' }}>{error}</span>
        </div>
      )}

      {preview.length > 0 && !resultado && (
        <button
          onClick={importar}
          disabled={importando}
          style={{ padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
        >
          {importando ? 'Importando...' : `Importar ${preview.length >= 3 ? 'preguntas' : preview.length}`}
        </button>
      )}

      {resultado && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
          <CheckCircle size={14} color="#15803d" />
          <span style={{ fontSize: '12px', color: '#15803d' }}>
            {resultado.importadas} importadas{resultado.errores?.length > 0 ? `, ${resultado.errores.length} errores` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
