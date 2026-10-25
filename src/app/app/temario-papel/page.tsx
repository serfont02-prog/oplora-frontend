'use client';

// ⭐ Temario en papel: ficha del temario completo impreso de la oposición del usuario.
// Mientras no se pueda pagar desde la app, el botón apunta al usuario a la lista de aviso.

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookCopy, Check, ChevronLeft, ChevronRight, FileText, Layers, Package, RefreshCw, Truck, X, Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTemarioPapel, formatoEuros } from '@/components/temario/TemarioPapel';
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, SOMBRA } from '@/styles/tokens';

const BG_APP = 'var(--c-bg-tema)';

function Dato({ Icono, titulo, valor }: { Icono: any; titulo: string; valor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--c-superficie-2)', borderRadius: 14, minWidth: 0 }}>
      <Icono size={17} color="var(--c-azul)" style={{ flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: TEXT_MUTED }}>{titulo}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>{valor}</div>
      </div>
    </div>
  );
}

export default function TemarioPapelPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const oposicionId = usuario?.oposicionActiva?.id;
  const { data, isLoading, isError } = useTemarioPapel(oposicionId);
  const [visor, setVisor] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [eleccion, setEleccion] = useState<Record<string, string>>({});

  const p = data?.producto;
  const imagenes = p?.imagenes ?? [];
  const grupos = p?.opciones ?? [];

  // Elección inicial: la guardada (si ya pidió aviso) o la primera opción de cada grupo
  useEffect(() => {
    if (!p) return;
    const inicial: Record<string, string> = {};
    for (const g of p.opciones ?? []) inicial[g.id] = data?.opciones?.[g.id] ?? g.valores[0]?.id;
    setEleccion(inicial);
  }, [p, data?.opciones]);

  const suplementos = useMemo(() => grupos.reduce((s, g) => s + (g.valores.find((v) => v.id === eleccion[g.id])?.suplemento ?? 0), 0), [grupos, eleccion]);
  const precioTotal = p?.precio != null ? p.precio + suplementos : null;

  const cambiarAviso = useMutation({
    mutationFn: async ({ quiero, opciones }: { quiero: boolean; opciones?: Record<string, string> }) => {
      const url = `/temario-papel/oposicion/${oposicionId}/interes`;
      return (quiero ? await api.post(url, { opciones }) : await api.delete(url)).data;
    },
    onMutate: () => setError(''),
    onSuccess: (res: any) => {
      queryClient.setQueryData(['temario-papel', oposicionId], (prev: any) => (prev ? { ...prev, interesado: !!res?.interesado, opciones: res?.opciones ?? null } : prev));
    },
    onError: () => setError('No se ha podido guardar. Comprueba la conexión e inténtalo de nuevo.'),
  });

  const elegir = (grupo: string, valor: string) => {
    const nueva = { ...eleccion, [grupo]: valor };
    setEleccion(nueva);
    // Si ya pidió aviso, se guarda al momento cómo lo quiere
    if (data?.interesado) cambiarAviso.mutate({ quiero: true, opciones: nueva });
  };

  const volver = () => (window.history.length > 1 ? router.back() : router.push('/app/dashboard'));

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: 120 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 0' }}>
          <button
            onClick={volver}
            aria-label="Volver"
            style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'var(--c-superficie)', boxShadow: SOMBRA, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={18} color={TEXT_PRIMARY} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Temario en papel</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.25 }}>{usuario?.oposicionActiva?.nombre ?? 'Tu oposición'}</div>
          </div>
        </div>

        {isLoading && <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 16, fontSize: 13, color: TEXT_MUTED }}>Cargando…</div>}

        {!isLoading && (isError || !p) && (
          <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: '22px 18px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--c-azul-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <BookCopy size={22} color="var(--c-azul)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>{isError ? 'No se ha podido cargar' : 'Todavía no hay temario en papel'}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4, lineHeight: 1.5 }}>
              {isError ? 'Comprueba la conexión e inténtalo de nuevo.' : 'Estamos preparando el temario impreso de tu oposición.'}
            </div>
          </div>
        )}

        {p && (
          <>
            {/* Galería: portada y páginas de muestra */}
            {imagenes.length > 0 && (
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '4px 4px 10px', margin: '0 -4px' }}>
                {imagenes.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setVisor(i)}
                    aria-label={i === 0 ? 'Ver portada' : `Ver página de muestra ${i}`}
                    style={{ flex: '0 0 auto', border: 'none', padding: 0, background: 'none', cursor: 'zoom-in', scrollSnapAlign: 'start' }}
                  >
                    <img
                      src={src}
                      alt={i === 0 ? 'Portada del temario' : `Página de muestra ${i}`}
                      style={{ height: 250, width: 'auto', aspectRatio: '612 / 792', objectFit: 'cover', borderRadius: 6, display: 'block', background: '#fff', boxShadow: '0 8px 22px rgba(15,23,42,0.18)' }}
                    />
                  </button>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                {p.edicion && (
                  <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: 'var(--c-azul)', background: 'var(--c-azul-bg)', borderRadius: 999, padding: '3px 9px', marginBottom: 8 }}>{p.edicion}</span>
                )}
                <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, lineHeight: 1.2 }}>{p.titulo}</div>
                {precioTotal != null && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRIMARY }}>{formatoEuros(precioTotal)}</span>
                    <span style={{ fontSize: 12, color: TEXT_MUTED }}>
                      {p.gastosEnvio == null ? '' : p.gastosEnvio === 0 ? 'Envío incluido' : `+ ${formatoEuros(p.gastosEnvio)} de envío`}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {p.paginas != null && <Dato Icono={FileText} titulo="Páginas" valor={String(p.paginas)} />}
                {p.tomos != null && <Dato Icono={Layers} titulo="Tomos" valor={String(p.tomos)} />}
                {p.encuadernacion && <Dato Icono={Package} titulo="Encuadernación" valor={p.encuadernacion} />}
                {p.plazoEnvio && <Dato Icono={Truck} titulo="Envío" valor={p.plazoEnvio} />}
              </div>

              {p.descripcion && (
                <div style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{p.descripcion}</div>
              )}
            </div>

            {grupos.length > 0 && (
              <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>Elige cómo lo quieres</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                    {data?.interesado ? 'Guardamos tu elección para cuando abramos los pedidos.' : 'Nos ayuda a preparar los ejemplares. Podrás cambiarlo al pedirlo.'}
                  </div>
                </div>
                {grupos.map((g) => (
                  <div key={g.id}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_SECONDARY, marginBottom: 6 }}>{g.nombre}</div>
                    <div role="radiogroup" aria-label={g.nombre} style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(g.valores.length, 3)}, 1fr)`, gap: 8 }}>
                      {g.valores.map((v) => {
                        const activo = eleccion[g.id] === v.id;
                        return (
                          <button
                            key={v.id}
                            role="radio"
                            aria-checked={activo}
                            onClick={() => elegir(g.id, v.id)}
                            style={{
                              textAlign: 'left', padding: '10px 12px', borderRadius: 14, cursor: 'pointer',
                              border: activo ? '1.5px solid var(--c-azul)' : '1px solid var(--c-borde)',
                              background: activo ? 'var(--c-azul-bg)' : 'var(--c-superficie)',
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 700, color: activo ? 'var(--c-azul)' : TEXT_PRIMARY }}>{v.nombre}</div>
                            {(v.descripcion || (v.suplemento ?? 0) > 0) && (
                              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2, lineHeight: 1.35 }}>
                                {[v.descripcion, (v.suplemento ?? 0) > 0 ? `+${formatoEuros(v.suplemento!)}` : null].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--c-superficie)', borderRadius: 18, boxShadow: SOMBRA, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--c-verde-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RefreshCw size={18} color="var(--c-verde)" />
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>El papel para estudiar, la app siempre al día</div>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 3, lineHeight: 1.5 }}>
                  Subraya y haz tus esquemas en el libro. Si cambia una ley, lo verás actualizado en la app, junto a los test, las flashcards y los retos.
                </div>
              </div>
            </div>

            {error && <div style={{ background: 'var(--hx-fef2f2)', color: 'var(--hx-b91c1c)', borderRadius: 14, padding: '10px 12px', fontSize: 13 }}>{error}</div>}
          </>
        )}
      </div>

      {/* Acción fija abajo */}
      {p && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: BG_APP, borderTop: '1px solid var(--c-borde)', padding: '12px 1.25rem calc(12px + env(safe-area-inset-bottom))', zIndex: 40 }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {data?.interesado ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--c-verde-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={18} color="var(--c-verde)" strokeWidth={3} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>Te avisaremos en cuanto puedas pedirlo</div>
                  <button
                    onClick={() => cambiarAviso.mutate({ quiero: false })}
                    disabled={cambiarAviso.isPending}
                    style={{ border: 'none', background: 'none', padding: 0, marginTop: 2, fontSize: 12, color: TEXT_MUTED, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Ya no me interesa
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => cambiarAviso.mutate({ quiero: true, opciones: eleccion })}
                  disabled={cambiarAviso.isPending}
                  style={{ width: '100%', padding: 14, border: 'none', borderRadius: 14, background: 'var(--c-primario)', color: 'var(--c-primario-texto)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: cambiarAviso.isPending ? 0.7 : 1 }}
                >
                  <Bell size={16} />
                  Avísame cuando esté disponible
                </button>
                <div style={{ fontSize: 11, color: TEXT_MUTED, textAlign: 'center', marginTop: 6 }}>Aún no se puede pedir desde la app. Te avisaremos aquí.</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Visor a pantalla completa */}
      {visor !== null && imagenes[visor] && (
        <div
          onClick={() => setVisor(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <button onClick={() => setVisor(null)} aria-label="Cerrar" style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={20} color="#fff" />
          </button>
          {visor > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setVisor(visor - 1); }} aria-label="Anterior" style={{ position: 'absolute', left: 8, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ChevronLeft size={22} color="#fff" />
            </button>
          )}
          <img
            src={imagenes[visor]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '88vh', borderRadius: 6, background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
          />
          {visor < imagenes.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setVisor(visor + 1); }} aria-label="Siguiente" style={{ position: 'absolute', right: 8, width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ChevronRight size={22} color="#fff" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
