'use client';

import { useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, CheckCircle2, Lock, ChevronRight, BookOpen, FileText, Upload, Layers } from 'lucide-react';
import { FooterNavegacion } from '@/app/app/dashboard/page';
import { AvatarPerfil } from '@/components/AvatarUsuarioPerfil';

type Tab = 'programa' | 'material';

const BG_APP = '#F5F1EB'; // marrón pastel muy claro
const BG_WIDGET = '#EFE9E0';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#9CA3AF';
const COLOR_ESTUDIAR = '#1F7CFF';

export default function TemarioOposicionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const oposicionId = params.oposicionId as string;
  const modoEstudiar = searchParams.get('modo') === 'estudiar';
  const { usuario, cargando } = useAuth();

  const [tab, setTab] = useState<Tab>('programa');
  const [busqueda, setBusqueda] = useState('');
  const [subiendoApunte, setSubiendoApunte] = useState(false);
  const queryClient = useQueryClient();

  const { data: apuntesOploraOposicion = [] } = useQuery({
    queryKey: ['apuntes-oplora-oposicion', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/apuntes-oplora/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: misApuntesOposicion = [] } = useQuery({
    queryKey: ['mis-apuntes-oposicion', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/apuntes-usuario/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: oposicion } = useQuery({
    queryKey: ['oposicion-temario', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${oposicionId}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias-temario', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const convocatoria = useMemo(
    () => convocatorias.find((c: any) => c.estado === 'activa') ?? convocatorias[0],
    [convocatorias]
  );

  const { data: temas = [], isLoading } = useQuery({
    queryKey: ['temas-temario', convocatoria?.id],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoria.id}`);
      return res.data;
    },
    enabled: !!convocatoria?.id,
  });

  // ⭐ Progreso detallado de todos los temas en una sola llamada
  const { data: progresoTemas = [] } = useQuery({
    queryKey: ['progreso-temas-detalle', convocatoria?.id, oposicionId],
    queryFn: async () => {
      const res = await api.get(`/temas/convocatoria/${convocatoria.id}/progreso-completo?oposicionId=${oposicionId}`);
      return res.data;
    },
    enabled: !!convocatoria?.id && !!oposicionId,
  });

  const progresoPorTemaId = useMemo(() => {
    const map: Record<string, any> = {};
    progresoTemas.forEach((p: any) => { map[p.temaId] = p; });
    return map;
  }, [progresoTemas]);

  const { data: leyes = [] } = useQuery({
    queryKey: ['leyes-temario', oposicionId],
    queryFn: async () => {
      const res = await api.get(`/leyes/oposicion/${oposicionId}`);
      return res.data;
    },
    enabled: !!usuario,
  });

  const nivel = usuario?.nivel ?? 'principiante';

  const temasFiltrados = useMemo(() => {
    if (!busqueda) return temas;
    return temas.filter((t: any) =>
      t.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(t.numero).includes(busqueda)
    );
  }, [temas, busqueda]);

  const completados = progresoTemas.filter((p: any) => p.porcentajeTotal >= 80).length;
  const porcentajeGlobal = progresoTemas.length > 0
    ? Math.round(progresoTemas.reduce((acc: number, p: any) => acc + p.porcentajeTotal, 0) / progresoTemas.length)
    : 0;

  if (cargando) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG_APP, paddingBottom: '90px' }}>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1.25rem 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        
        <div style={{ padding: '4px 4px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: TEXT_MUTED, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Estudiar
            </div>
            <div style={{ fontSize: '19px', fontWeight: 700, color: TEXT_PRIMARY, lineHeight: 1.3 }}>
              {oposicion?.nombre ?? 'Tu oposición'}
            </div>
          </div>
          <button
            onClick={() => router.push('/app/perfil')}
            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
          >
            <AvatarPerfil usuario={usuario} size={44} />
          </button>
        </div>

        {/* ── TABS TIPO iOS/REVOLUT ── */}
        <div style={{ display: 'flex', background: '#E5DED2', borderRadius: '12px', padding: '3px', gap: '3px' }}>
          {([
            { key: 'programa', label: 'Programa', icon: Layers },
            { key: 'material', label: 'Material', icon: BookOpen },
          ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '9px 4px', border: 'none', borderRadius: '9px',
                background: tab === key ? 'white' : 'none',
                boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer', fontSize: '13px',
                fontWeight: tab === key ? 700 : 500,
                color: tab === key ? TEXT_PRIMARY : TEXT_SECONDARY,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

{/* ── TAB PROGRAMA — mapa de progreso con anillo circular ── */}
{tab === 'programa' && (
  <>
    {/* Progreso global */}
    {temas.length > 0 && (
      <div style={{ background: BG_WIDGET, borderRadius: '16px', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: TEXT_SECONDARY, fontWeight: 600 }}>
            {completados} de {temas.length} temas completados
          </span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: COLOR_ESTUDIAR }}>{porcentajeGlobal}%</span>
        </div>
        <div style={{ height: '7px', background: 'white', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            width: `${porcentajeGlobal}%`, height: '100%',
            background: `linear-gradient(90deg, ${COLOR_ESTUDIAR}, #60a5fa)`,
            borderRadius: '999px', transition: 'width 0.5s ease',
          }} />
        </div>
      </div>
    )}

    {/* Buscador */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', borderRadius: '12px', padding: '10px 14px' }}>
      <Search size={15} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
      <input
        type="text"
        placeholder="Buscar tema..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', color: TEXT_PRIMARY, background: 'transparent' }}
      />
      {busqueda && (
        <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, fontSize: '16px', lineHeight: 1, padding: 0 }}>×</button>
      )}
    </div>

    {/* Mapa de progreso */}
    {isLoading ? (
      <div style={{ background: BG_WIDGET, borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: TEXT_MUTED }}>Cargando temario...</div>
      </div>
    ) : temasFiltrados.length === 0 ? (
      <div style={{ background: BG_WIDGET, borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '28px', marginBottom: '10px' }}>📚</div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: TEXT_PRIMARY, marginBottom: '4px' }}>
          {temas.length === 0 ? 'Temario no disponible' : 'Sin resultados'}
        </div>
        <div style={{ fontSize: '12px', color: TEXT_MUTED }}>
          {temas.length === 0 ? 'El temario de esta convocatoria está siendo preparado' : 'Prueba con otro término'}
        </div>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {temasFiltrados.map((tema: any) => {
          const prog = progresoPorTemaId[tema.id];
          const porcentaje = prog?.porcentajeTotal ?? 0;
          const completado = porcentaje >= 80;
          const bloqueado = nivel === 'principiante' && tema.numero > 10;
          const clickable = modoEstudiar && !bloqueado;

          // Cálculo del anillo SVG
          const radio = 22;
          const circunferencia = 2 * Math.PI * radio;
          const offset = circunferencia - (Math.min(porcentaje, 100) / 100) * circunferencia;
          const colorAnillo = completado ? '#16A34A' : porcentaje > 0 ? COLOR_ESTUDIAR : '#D1D5DB';
          const grosorAnillo = porcentaje > 0 || completado ? '4' : '2.5'; // ⭐ más fino cuando es 0%

          return (
            <button
              key={tema.id}
              onClick={() => clickable && router.push(`/app/tema/${oposicionId}/${tema.numero}`)}
              style={{
                background: 'white', border: 'none', borderRadius: '16px',
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '14px',
                cursor: clickable ? 'pointer' : 'default',
                opacity: bloqueado ? 0.55 : 1,
                width: '100%', textAlign: 'left', boxSizing: 'border-box',
                minHeight: '78px',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
              }}
              onTouchStart={(e) => { if (clickable) { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; } }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseDown={(e) => { if (clickable) { e.currentTarget.style.transform = 'scale(0.99)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; } }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Bloque izquierdo: anillo + número + % debajo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '52px' }}>
                <div style={{ position: 'relative', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="52" height="52" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                    <circle cx="26" cy="26" r={radio} fill="none" stroke="#F1F5F9" strokeWidth={grosorAnillo} />
                    <circle
                      cx="26" cy="26" r={radio} fill="none"
                      stroke={colorAnillo} strokeWidth={grosorAnillo} strokeLinecap="round"
                      strokeDasharray={circunferencia} strokeDashoffset={offset}
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  {completado ? (
                    <CheckCircle2 size={20} color="#16A34A" />
                  ) : (
                    <span style={{ fontSize: '15px', fontWeight: 700, color: porcentaje > 0 ? TEXT_PRIMARY : TEXT_MUTED }}>
                      {tema.numero}
                    </span>
                  )}
                </div>
                {porcentaje > 0 && porcentaje < 100 && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: colorAnillo, marginTop: '2px' }}>
                    {porcentaje}%
                  </span>
                )}
              </div>

              {/* Título del tema */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT_PRIMARY, lineHeight: 1.4 }}>
                  {tema.titulo}
                </div>
              </div>

              {bloqueado && <Lock size={14} color="#d1d5db" style={{ flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    )}
  </>
)}

{/* ── TAB MATERIAL — lista plana, sin cajas dentro de cajas ── */}
{tab === 'material' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

    {/* Apuntes OPLORA */}
    {apuntesOploraOposicion.length > 0 && (
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Apuntes OPLORA ({apuntesOploraOposicion.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {apuntesOploraOposicion.map((ap: any) => (
            <button
              key={ap.id}
              onClick={() => router.push(`/app/apuntes/${ap.id}`)}
              style={{
                background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px',
                padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                minHeight: '70px', boxSizing: 'border-box',
                transition: 'background 0.18s ease, transform 0.18s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.transform = 'scale(1.01)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF9E7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={16} color="#C79A1E" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ap.titulo}
                </div>
                {ap.descripcion && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ap.descripcion}
                  </div>
                )}
                {/* ⭐ NUEVO — metadatos */}
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px', display: 'flex', gap: '6px' }}>
                  {ap.tipo && <span>{ap.tipo.toUpperCase()}</span>}
                  {ap.paginas && <span>· {ap.paginas} págs</span>}
                  {ap.tamanoBytes && <span>· {(ap.tamanoBytes / 1024 / 1024).toFixed(1)} MB</span>}
                </div>
              </div>
              <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
        
      </div>
    )}

    {/* Normativa */}
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
        Normativa ({leyes.length})
      </div>
      {leyes.length === 0 ? (
        <div style={{ fontSize: '13px', color: TEXT_MUTED, padding: '4px 2px' }}>
          No hay normativa vinculada a esta oposición
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          {leyes.map((ol: any) => {
            const ley = ol.ley;
            const version = ol.versionLey;
            return (
              <button
                key={ol.id}
                onClick={() => router.push(`/app/ley/${ol.versionLey?.leyId ?? ol.ley?.id}?oposicionId=${oposicionId}`)}
                style={{
                  background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px',
                  padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  minHeight: '70px', boxSizing: 'border-box',
                  transition: 'background 0.18s ease, transform 0.18s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.transform = 'scale(1.01)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F3F0FC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={16} color="#8B5CF6" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ley?.nombre}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {version?.tipoNorma ?? 'Normativa'}{version?.referenciaBoe ? ` · ${version.referenciaBoe}` : ''}
                  </div>
                </div>
                <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}
    </div>

    {/* Mis apuntes */}
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
        Mis apuntes ({misApuntesOposicion.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
        {misApuntesOposicion.map((ap: any) => (
          <a
            key={ap.id}
            href={ap.urlArchivo}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'white', border: '1px solid #F1F5F9', borderRadius: '14px',
              padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
              cursor: ap.urlArchivo ? 'pointer' : 'default', textDecoration: 'none',
              minHeight: '70px', boxSizing: 'border-box',
              transition: 'background 0.18s ease, transform 0.18s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.transform = 'scale(1.01)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EAF2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={16} color="#2563EB" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ap.nombre}
              </div>
              {/* ⭐ NUEVO — metadatos deducidos */}
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px', display: 'flex', gap: '6px' }}>
                <span>{new Date(ap.creadoEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                {ap.nombre?.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i) && (
                  <span>· {ap.nombre.split('.').pop()?.toUpperCase()}</span>
                )}
              </div>
            </div>
            <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
          </a>
        ))}

        <input
          id="apunte-oposicion-input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setSubiendoApunte(true);
            try {
              const formData = new FormData();
              formData.append('archivo', file);
              formData.append('oposicionId', oposicionId);
              await api.post(`/apuntes-usuario/oposicion/${oposicionId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              queryClient.invalidateQueries({ queryKey: ['mis-apuntes-oposicion', oposicionId] });
            } catch (err) {
              console.error('Error subiendo apunte:', err);
            } finally {
              setSubiendoApunte(false);
              e.target.value = '';
            }
          }}
        />
        <button
          onClick={() => document.getElementById('apunte-oposicion-input')?.click()}
          disabled={subiendoApunte}
          style={{
            background: 'white', border: '1.5px dashed #D1D5DB', borderRadius: '14px',
            padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
            cursor: 'pointer', width: '100%', minHeight: '70px', boxSizing: 'border-box',
            transition: 'background 0.18s ease, transform 0.18s ease',
          }}
          onMouseEnter={(e) => { if (!subiendoApunte) { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.transform = 'scale(1.01)'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
        >

          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Upload size={16} color="#6b7280" />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
            {subiendoApunte ? 'Subiendo...' : 'Subir nuevo apunte'}
          </div>
        </button>
      </div>
    </div>

  </div>
)}

      </div>

      <FooterNavegacion usuario={usuario} oposicionId={oposicionId} activo="estudiar" />

    </div>
  );
}