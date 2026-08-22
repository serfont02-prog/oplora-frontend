'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, FileText, BarChart2, ExternalLink, Trash2 } from 'lucide-react';
import { api, Convocatoria } from '@/lib/api';

const ESTADO_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  activa: { bg: '#f0fdf4', color: '#15803d', label: 'Activa' },
  cerrada: { bg: '#f3f4f6', color: '#6b7280', label: 'Cerrada' },
  borrador: { bg: '#fffbeb', color: '#92400e', label: 'Borrador' },
};

export default function OposicionDetallePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [modalNuevaConv, setModalNuevaConv] = useState(false);
  const [modalEditarOpo, setModalEditarOpo] = useState(false);
  const [modalEditarConv, setModalEditarConv] = useState(false);
  const [convEditando, setConvEditando] = useState<any>(null);

  const [formNuevaConv, setFormNuevaConv] = useState({
    anyo: new Date().getFullYear().toString(),
    plazas: '',
    estado: 'activa',
    turno: '',
    urlInap: '',
    referenciaBoe: '',
    fechaExamen: '',
    ejercicios: [] as { numero: number; tipo: string; numPreguntas: string; tiempoMinutos: string; descripcion: string }[],
    fraccionPenalizacion: '',
    notaMinimaAprobado: '',
    diferenciasAnterior: '',
    requisitos: '',
    formacionPosterior: '',
    descripcionAdicional: '',
    generaBolsaEmpleo: false,
    bolsaEmpleoDescripcion: '',
    plazasLibres: '',
    plazasPromocionInterna: '',
    plazasMilitares: '',
    plazasDiscapacidad: '',
    fasesTexto: '',
    puestosTexto: '',
    bloquesTemarioTexto: '',
  });

  const [formEditarOpo, setFormEditarOpo] = useState({
    nombre: '',
    administracion: '',
    ministerio: '',
    subgrupo: '',
    tipoAdministracion: '',
    categoria: '',
  });

const [formEditarConv, setFormEditarConv] = useState({
  anyo: '',
  plazas: '',
  estado: 'activa',
  turno: '',
  urlInap: '',
  referenciaBoe: '',
  fechaExamen: '',
 ejercicios: [] as { numero: number; tipo: string; numPreguntas: string; tiempoMinutos: string; descripcion: string }[],
  fraccionPenalizacion: '',
  notaMinimaAprobado: '',
  diferenciasAnterior: '',
  requisitos: '',
  formacionPosterior: '',
  descripcionAdicional: '',
  generaBolsaEmpleo: false,
  bolsaEmpleoDescripcion: '',
  plazasLibres: '', 
  plazasPromocionInterna: '', 
  plazasMilitares: '', 
  plazasDiscapacidad: '', 
  fasesTexto: '', 
  puestosTexto: '', 
  bloquesTemarioTexto: '', 
});

  const { data: oposicion, isLoading } = useQuery({
    queryKey: ['oposicion', id],
    queryFn: async () => {
      const res = await api.get(`/oposiciones/${id}`);
      return res.data;
    },
  });

  const { data: convocatorias = [] } = useQuery({
    queryKey: ['convocatorias', id],
    queryFn: async () => {
      const res = await api.get(`/convocatorias/oposicion/${id}`);
      return res.data as Convocatoria[];
    },
  });

 useEffect(() => {
  if (oposicion) {
    setFormEditarOpo({
      nombre: oposicion.nombre ?? '',
      administracion: oposicion.administracion ?? '',
      ministerio: oposicion.ministerio ?? '',
      subgrupo: oposicion.subgrupo ?? '',
      tipoAdministracion: oposicion.tipoAdministracion ?? '',
      categoria: oposicion.categoria ?? '',
    });
  }
}, [oposicion]);

  const eliminarOpo = useMutation({
    mutationFn: async () => { await api.delete(`/oposiciones/${id}`); },
    onSuccess: () => router.push('/admin/oposiciones'),
  });

  const editarOpo = useMutation({
  mutationFn: async () => {
    const payload = {
      ...formEditarOpo,
      subgrupo: formEditarOpo.subgrupo || null, 
      categoria: formEditarOpo.categoria || null,
      administracion: formEditarOpo.administracion || null,
      ministerio: formEditarOpo.ministerio || null,
    };
    await api.patch(`/oposiciones/${id}`, payload);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['oposicion', id] });
    setModalEditarOpo(false);
  },
});

  const eliminarConv = useMutation({
  mutationFn: async (convocatoriaId: string) => {
    await api.delete(`/convocatorias/${convocatoriaId}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['convocatorias', id] });
  },
});

const crearConv = useMutation({
  mutationFn: async () => {
    const plazasDesglose = (formNuevaConv.plazasLibres || formNuevaConv.plazasPromocionInterna || formNuevaConv.plazasMilitares || formNuevaConv.plazasDiscapacidad)
      ? {
          libres: formNuevaConv.plazasLibres ? parseInt(formNuevaConv.plazasLibres) : undefined,
          promocionInterna: formNuevaConv.plazasPromocionInterna ? parseInt(formNuevaConv.plazasPromocionInterna) : undefined,
          militares: formNuevaConv.plazasMilitares ? parseInt(formNuevaConv.plazasMilitares) : undefined,
          discapacidad: formNuevaConv.plazasDiscapacidad ? parseInt(formNuevaConv.plazasDiscapacidad) : undefined,
        }
      : undefined;

      const res = await api.post('/convocatorias', {
        anyo: parseInt(formNuevaConv.anyo),
        plazas: formNuevaConv.plazas ? parseInt(formNuevaConv.plazas) : undefined,
        estado: formNuevaConv.estado,
        turno: formNuevaConv.turno || undefined,
        urlInap: formNuevaConv.urlInap || undefined,
        referenciaBoe: formNuevaConv.referenciaBoe || undefined,
        fechaExamen: formNuevaConv.fechaExamen || undefined,
        ejercicios: formNuevaConv.ejercicios.length > 0
        ? formNuevaConv.ejercicios.map((ej) => ({
            numero: ej.numero,
            tipo: ej.tipo,
            numPreguntas: ej.numPreguntas ? parseInt(ej.numPreguntas) : undefined,
            tiempoMinutos: ej.tiempoMinutos ? parseInt(ej.tiempoMinutos) : undefined,
            descripcion: ej.descripcion || undefined,
          }))
        : undefined,
        fraccionPenalizacion: formNuevaConv.fraccionPenalizacion || undefined,
        notaMinimaAprobado: formNuevaConv.notaMinimaAprobado ? parseFloat(formNuevaConv.notaMinimaAprobado) : undefined,
        diferenciasAnterior: formNuevaConv.diferenciasAnterior || undefined,
        requisitos: formNuevaConv.requisitos || undefined,
        formacionPosterior: formNuevaConv.formacionPosterior || undefined,
        descripcionAdicional: formNuevaConv.descripcionAdicional || undefined,
        generaBolsaEmpleo: formNuevaConv.generaBolsaEmpleo,
        bolsaEmpleoDescripcion: formNuevaConv.bolsaEmpleoDescripcion || undefined,
        plazasDesglose,
        fasesAdicionales: parsearFases(formNuevaConv.fasesTexto),
        puestos: parsearPuestos(formNuevaConv.puestosTexto),
        bloquesTemario: parsearBloques(formNuevaConv.bloquesTemarioTexto),
        oposicionId: id,
      });

      if (formNuevaConv.urlInap) {
        await api.post(`/convocatorias/${res.data.id}/scrape`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convocatorias', id] });
      queryClient.invalidateQueries({ queryKey: ['oposicion', id] });
      setModalNuevaConv(false);
      setFormNuevaConv({
        anyo: new Date().getFullYear().toString(), plazas: '', estado: 'activa', turno: '',
        urlInap: '', referenciaBoe: '', fechaExamen: '', ejercicios: [],
        fraccionPenalizacion: '',
        notaMinimaAprobado: '', diferenciasAnterior: '', requisitos: '', formacionPosterior: '',
        descripcionAdicional: '', generaBolsaEmpleo: false, bolsaEmpleoDescripcion: '',
        plazasLibres: '', plazasPromocionInterna: '', plazasMilitares: '', plazasDiscapacidad: '',
        fasesTexto: '', puestosTexto: '', bloquesTemarioTexto: '',
      });
    },
  });

      const copiarConvocatoria = useMutation({
      mutationFn: async (convocatoriaId: string) => {
        const res = await api.post(`/convocatorias/${convocatoriaId}/copiar`);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['convocatorias', id] });
      },
    });

      const editarConv = useMutation({
      mutationFn: async () => {
        const urlCambio = formEditarConv.urlInap !== (convEditando.urlInap ?? '');

        const plazasDesglose = (formEditarConv.plazasLibres || formEditarConv.plazasPromocionInterna || formEditarConv.plazasMilitares || formEditarConv.plazasDiscapacidad)
          ? {
              libres: formEditarConv.plazasLibres ? parseInt(formEditarConv.plazasLibres) : undefined,
              promocionInterna: formEditarConv.plazasPromocionInterna ? parseInt(formEditarConv.plazasPromocionInterna) : undefined,
              militares: formEditarConv.plazasMilitares ? parseInt(formEditarConv.plazasMilitares) : undefined,
              discapacidad: formEditarConv.plazasDiscapacidad ? parseInt(formEditarConv.plazasDiscapacidad) : undefined,
            }
          : null;

        await api.patch(`/convocatorias/${convEditando.id}`, {
          anyo: parseInt(formEditarConv.anyo),
          plazas: formEditarConv.plazas ? parseInt(formEditarConv.plazas) : undefined,
          estado: formEditarConv.estado,
          turno: formEditarConv.turno || null,
          urlInap: formEditarConv.urlInap || undefined,
          referenciaBoe: formEditarConv.referenciaBoe || undefined,
          fechaExamen: formEditarConv.fechaExamen || undefined,
          ejercicios: formEditarConv.ejercicios.length > 0
          ? formEditarConv.ejercicios.map((ej) => ({
              numero: ej.numero,
              tipo: ej.tipo,
              numPreguntas: ej.numPreguntas ? parseInt(ej.numPreguntas) : undefined,
              tiempoMinutos: ej.tiempoMinutos ? parseInt(ej.tiempoMinutos) : undefined,
              descripcion: ej.descripcion || undefined,
            }))
          : null,
          fraccionPenalizacion: formEditarConv.fraccionPenalizacion || undefined,
          notaMinimaAprobado: formEditarConv.notaMinimaAprobado ? parseFloat(formEditarConv.notaMinimaAprobado) : undefined,
          diferenciasAnterior: formEditarConv.diferenciasAnterior || undefined,
          requisitos: formEditarConv.requisitos || null,
          formacionPosterior: formEditarConv.formacionPosterior || null,
          descripcionAdicional: formEditarConv.descripcionAdicional || null,
          generaBolsaEmpleo: formEditarConv.generaBolsaEmpleo,
          bolsaEmpleoDescripcion: formEditarConv.bolsaEmpleoDescripcion || null,
          plazasDesglose,
          fasesAdicionales: parsearFases(formEditarConv.fasesTexto) ?? null,
          puestos: parsearPuestos(formEditarConv.puestosTexto) ?? null,
          bloquesTemario: parsearBloques(formEditarConv.bloquesTemarioTexto) ?? null,
        });

        if (urlCambio && formEditarConv.urlInap) {
          await api.patch(`/convocatorias/${convEditando.id}/url-inap`, {
            urlInap: formEditarConv.urlInap,
          });
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['convocatorias', id] });
        setModalEditarConv(false);
        setConvEditando(null);
      },
    });

  const scrapeManual = useMutation({
    mutationFn: async (convocatoriaId: string) => {
      await api.post(`/convocatorias/${convocatoriaId}/scrape`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['convocatorias', id] }),
  });

    const abrirEditarConv = (c: any) => {
    setConvEditando(c);
    setFormEditarConv({
      anyo: c.anyo?.toString() ?? '',
      plazas: c.plazas?.toString() ?? '',
      estado: c.estado ?? 'activa',
      turno: c.turno ?? '',
      urlInap: c.urlInap ?? '',
      referenciaBoe: c.referenciaBoe ?? '',
      fechaExamen: c.fechaExamen ? new Date(c.fechaExamen).toISOString().split('T')[0] : '',
      ejercicios: (c.ejercicios ?? []).map((ej: any) => ({
        numero: ej.numero,
        tipo: ej.tipo,
        numPreguntas: ej.numPreguntas?.toString() ?? '',
        tiempoMinutos: ej.tiempoMinutos?.toString() ?? '',
        descripcion: ej.descripcion ?? '',
      })),
      fraccionPenalizacion: c.fraccionPenalizacion ?? '',
      notaMinimaAprobado: c.notaMinimaAprobado?.toString() ?? '',
      diferenciasAnterior: c.diferenciasAnterior ?? '',
      requisitos: c.requisitos ?? '',
      formacionPosterior: c.formacionPosterior ?? '',
      descripcionAdicional: c.descripcionAdicional ?? '',
      generaBolsaEmpleo: c.generaBolsaEmpleo ?? false,
      bolsaEmpleoDescripcion: c.bolsaEmpleoDescripcion ?? '',
      plazasLibres: c.plazasDesglose?.libres?.toString() ?? '',
      plazasPromocionInterna: c.plazasDesglose?.promocionInterna?.toString() ?? '',
      plazasMilitares: c.plazasDesglose?.militares?.toString() ?? '',
      plazasDiscapacidad: c.plazasDesglose?.discapacidad?.toString() ?? '',
      fasesTexto: serializarFases(c.fasesAdicionales ?? []),
      puestosTexto: serializarPuestos(c.puestos ?? []),
      bloquesTemarioTexto: serializarBloques(c.bloquesTemario ?? []),
    });
    setModalEditarConv(true);
  };

  if (isLoading) return <div style={{ padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>Cargando...</div>;
  if (!oposicion) return <div style={{ padding: '2rem', fontSize: '13px', color: '#9ca3af' }}>No encontrada</div>;

      function parsearFases(texto: string) {
      if (!texto.trim()) return undefined;
      return texto.split('\n').filter(Boolean).map((linea, i) => {
        const [tipo, nombre, descripcion] = linea.split('|').map((s) => s?.trim());
        return { tipo: tipo || 'otro', nombre: nombre || '', descripcion: descripcion || undefined, orden: i + 1 };
      });
    }

    function parsearPuestos(texto: string) {
      if (!texto.trim()) return undefined;
      return texto.split('\n').filter(Boolean).map((linea) => {
        const [nombre, descripcion, requisitosEspecificos] = linea.split('|').map((s) => s?.trim());
        return { nombre: nombre || '', descripcion: descripcion || undefined, requisitosEspecificos: requisitosEspecificos || undefined };
      });
    }

    function parsearBloques(texto: string) {
      if (!texto.trim()) return undefined;
      return texto.split('\n').filter(Boolean).map((linea) => {
        const [nombre, descripcion] = linea.split('|').map((s) => s?.trim());
        return { nombre: nombre || '', descripcion: descripcion || undefined };
      });
    }

    function serializarFases(fases: any[] = []) {
      return fases.map((f) => `${f.tipo}|${f.nombre}|${f.descripcion ?? ''}`).join('\n');
    }

    function serializarPuestos(puestos: any[] = []) {
      return puestos.map((p) => `${p.nombre}|${p.descripcion ?? ''}|${p.requisitosEspecificos ?? ''}`).join('\n');
    }

    function serializarBloques(bloques: any[] = []) {
      return bloques.map((b) => `${b.nombre}|${b.descripcion ?? ''}`).join('\n');
    }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => router.push('/admin/oposiciones')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} />
          Oposiciones
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oposicion.nombre}</span>
      </div>

      {/* Header oposición */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', background: 'white', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>{oposicion.nombre}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: (oposicion as any).convocatoriasActivas > 0 ? '#f0fdf4' : '#f3f4f6', color: (oposicion as any).convocatoriasActivas > 0 ? '#15803d' : '#6b7280' }}>
              {(oposicion as any).convocatoriasActivas > 0 ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', gap: '8px' }}>
            {oposicion.administracion && <span>{oposicion.administracion}</span>}
            {oposicion.ministerio && <><span>·</span><span>{oposicion.ministerio}</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setModalEditarOpo(true)}
            style={{ padding: '7px 12px', fontSize: '12px', color: '#374151', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Pencil size={12} />
            Editar
          </button>
          <button
            onClick={() => { if (confirm('¿Eliminar esta oposición?')) eliminarOpo.mutate(); }}
            style={{ padding: '7px 12px', fontSize: '12px', color: '#dc2626', background: 'white', border: '1px solid #fee2e2', borderRadius: '8px', cursor: 'pointer' }}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '10px 1.5rem', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', gap: '16px' }}>
        {[
          { label: 'Convocatorias', value: convocatorias.length },
          { label: 'Leyes vinculadas', value: (oposicion as any).oposicionLeyes?.length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Convocatorias */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f9fafb' }}>
        <div style={{ padding: '12px 1.5rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Convocatorias</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {convocatorias.length > 0 && (
              <button
                onClick={() => {
                  const ultima = (convocatorias as any[])[0];
                  if (confirm(`¿Copiar convocatoria ${ultima.anyo} como base para una nueva?`)) {
                    copiarConvocatoria.mutate(ultima.id);
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
              >
                📋 Copiar anterior
              </button>
            )}
            <button
              onClick={() => setModalNuevaConv(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#111827', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
            >
              <Plus size={13} />
              Nueva
            </button>
          </div>
        </div>

        {convocatorias.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>No hay convocatorias. Añade la primera.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 1.5rem 1.5rem' }}>
            {(convocatorias as any[]).map((c) => {
              const badge = ESTADO_BADGE[c.estado] ?? ESTADO_BADGE.borrador;
              return (
                <div key={c.id} style={{ background: 'white', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{c.anyo}</div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 500, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                      {c.plazas && <span style={{ fontSize: '12px', color: '#6b7280' }}>{c.plazas.toLocaleString()} plazas</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => abrirEditarConv(c)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Editar">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => router.push(`/admin/oposiciones/${id}/temas?convocatoriaId=${c.id}`)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Temas">
                        <span style={{ fontSize: '12px' }}>📋</span>
                      </button>
                      <button onClick={() => router.push(`/admin/oposiciones/${id}/convocatorias/${c.id}/documentos`)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Documentos">
                        <FileText size={12} />
                      </button>
                      <button onClick={() => router.push(`/admin/oposiciones/${id}/convocatorias/${c.id}/examenes`)} style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Exámenes">
                        <span style={{ fontSize: '12px' }}>📝</span>
                      </button>
                      <button
                          onClick={() => router.push(`/admin/oposiciones/${id}/convocatorias/${c.id}/preguntas`)}
                          style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }}
                          title="Importar preguntas"
                        >
                          <span style={{ fontSize: '12px' }}>❓</span>
                        </button>
                      <button style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#6b7280' }} title="Estadísticas">
                        <BarChart2 size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la convocatoria ${c.anyo}? Esta acción no se puede deshacer.`)) {
                            eliminarConv.mutate(c.id);
                          }
                        }}
                        style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#dc2626' }}
                        title="Eliminar convocatoria"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                    {c.referenciaBoe && <span>📄 {c.referenciaBoe}</span>}
                    {c.fechaExamen && <span>📅 {new Date(c.fechaExamen).toLocaleDateString('es-ES')}</span>}
                    <span>📎 {c.documentos?.length ?? 0} documentos</span>
                  </div>

                  {c.urlInap ? (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f9fafb', borderRadius: '8px' }}>
                      <a href={c.urlInap} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#185FA5', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                        <ExternalLink size={11} />
                        {c.urlInap}
                      </a>
                      <button onClick={() => scrapeManual.mutate(c.id)} disabled={scrapeManual.isPending} style={{ fontSize: '11px', padding: '4px 10px', background: '#111827', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}>
                        {scrapeManual.isPending ? '...' : '↻ Actualizar'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', padding: '6px 10px', background: '#fffbeb', borderRadius: '8px', fontSize: '11px', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>⚠ Sin URL del INAP</span>
                      <button onClick={() => abrirEditarConv(c)} style={{ fontSize: '11px', color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Añadir →</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Modal nueva convocatoria */}
        {modalNuevaConv && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '480px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '1.25rem' }}>Nueva convocatoria</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Año</label>
                    <input type="number" value={formNuevaConv.anyo} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, anyo: e.target.value })} min="2000" max="2100" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Plazas</label>
                    <input type="number" value={formNuevaConv.plazas} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, plazas: e.target.value })} placeholder="1200" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Estado</label>
                    <select value={formNuevaConv.estado} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, estado: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="activa">Activa</option>
                      <option value="cerrada">Cerrada</option>
                      <option value="borrador">Borrador</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Turno</label>
                    <select value={formNuevaConv.turno} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, turno: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">Sin especificar</option>
                      <option value="libre">Libre</option>
                      <option value="promocion_interna">Promoción interna</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fecha examen</label>
                  <input type="date" value={formNuevaConv.fechaExamen} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, fechaExamen: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>URL INAP</label>
                  <input type="text" value={formNuevaConv.urlInap} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, urlInap: e.target.value })} placeholder="https://sede.inap.gob.es/..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Referencia BOE</label>
                  <input type="text" value={formNuevaConv.referenciaBoe} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, referenciaBoe: e.target.value })} placeholder="BOE-A-2025-..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                {/* Ejercicios de la prueba */}
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Ejercicios de la prueba</div>
                      <button
                        type="button"
                        onClick={() => setFormEditarConv({
                          ...formEditarConv,
                          ejercicios: [
                            ...formEditarConv.ejercicios,
                            { numero: formEditarConv.ejercicios.length + 1, tipo: 'test', numPreguntas: '', tiempoMinutos: '', descripcion: '' },
                          ],
                        })}
                        style={{ fontSize: '12px', color: '#1F7CFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        + Añadir ejercicio
                      </button>
                    </div>

                    {formEditarConv.ejercicios.length === 0 && (
                      <div style={{ fontSize: '12px', color: '#9ca3af', padding: '8px 0' }}>Sin ejercicios definidos todavía</div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {formEditarConv.ejercicios.map((ej, idx) => (
                        <div key={idx} style={{ background: '#FAFAFA', borderRadius: '10px', padding: '12px', position: 'relative' }}>
                          <button
                            type="button"
                            onClick={() => setFormEditarConv({
                              ...formEditarConv,
                              ejercicios: formEditarConv.ejercicios.filter((_, i) => i !== idx),
                            })}
                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '12px', fontWeight: 600 }}
                          >
                            ✕
                          </button>

                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginBottom: '8px' }}>Ejercicio {ej.numero}</div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tipo</label>
                              <select
                                value={ej.tipo}
                                onChange={(e) => {
                                  const nuevos = [...formEditarConv.ejercicios];
                                  nuevos[idx] = { ...ej, tipo: e.target.value };
                                  setFormEditarConv({ ...formEditarConv, ejercicios: nuevos });
                                }}
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                              >
                                <option value="test">Test</option>
                                <option value="desarrollo">Desarrollo</option>
                                <option value="oral">Oral</option>
                                <option value="practico">Práctico</option>
                                <option value="mixto">Mixto</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nº preguntas</label>
                              <input
                                type="number"
                                value={ej.numPreguntas}
                                onChange={(e) => {
                                  const nuevos = [...formEditarConv.ejercicios];
                                  nuevos[idx] = { ...ej, numPreguntas: e.target.value };
                                  setFormEditarConv({ ...formEditarConv, ejercicios: nuevos });
                                }}
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tiempo (min)</label>
                              <input
                                type="number"
                                value={ej.tiempoMinutos}
                                onChange={(e) => {
                                  const nuevos = [...formEditarConv.ejercicios];
                                  nuevos[idx] = { ...ej, tiempoMinutos: e.target.value };
                                  setFormEditarConv({ ...formEditarConv, ejercicios: nuevos });
                                }}
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Descripción</label>
                              <input
                                type="text"
                                value={ej.descripcion}
                                onChange={(e) => {
                                  const nuevos = [...formEditarConv.ejercicios];
                                  nuevos[idx] = { ...ej, descripcion: e.target.value };
                                  setFormEditarConv({ ...formEditarConv, ejercicios: nuevos });
                                }}
                                placeholder="Opcional"
                                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nota mínima</label>
                      <input type="number" step="0.01" value={formEditarConv.notaMinimaAprobado} onChange={(e) => setFormEditarConv({ ...formEditarConv, notaMinimaAprobado: e.target.value })} placeholder="5.00" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fracción penalización</label>
                      <input type="text" value={formEditarConv.fraccionPenalizacion} onChange={(e) => setFormEditarConv({ ...formEditarConv, fraccionPenalizacion: e.target.value })} placeholder="1/3" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                {/* Nota mínima y penalización — se quedan igual */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nota mínima</label>
                    <input type="number" step="0.01" value={formNuevaConv.notaMinimaAprobado} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, notaMinimaAprobado: e.target.value })} placeholder="5.00" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fracción penalización</label>
                    <input type="text" value={formNuevaConv.fraccionPenalizacion} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, fraccionPenalizacion: e.target.value })} placeholder="1/3" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Requisitos */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Requisitos oficiales</label>
                  <textarea value={formNuevaConv.requisitos} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, requisitos: e.target.value })} rows={4} placeholder="Nacionalidad española. Edad: desde 18 años..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

                {/* Plazas desglose */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Desglose de plazas</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="number" placeholder="Libres" value={formNuevaConv.plazasLibres} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, plazasLibres: e.target.value })} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    <input type="number" placeholder="Promoción interna" value={formNuevaConv.plazasPromocionInterna} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, plazasPromocionInterna: e.target.value })} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    <input type="number" placeholder="Militares" value={formNuevaConv.plazasMilitares} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, plazasMilitares: e.target.value })} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                    <input type="number" placeholder="Discapacidad" value={formNuevaConv.plazasDiscapacidad} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, plazasDiscapacidad: e.target.value })} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {/* Fases adicionales */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    Fases del proceso <span style={{ fontWeight: 400, color: '#9ca3af' }}>(una por línea: tipo|nombre|descripción)</span>
                  </label>
                  <textarea value={formNuevaConv.fasesTexto} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, fasesTexto: e.target.value })} rows={4} placeholder="fisica|Circuito de agilidad|
        psicotecnico|Aptitudes cognitivas|Eliminatorio" style={{ width: '100%', padding: '9px 12px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

                {/* Puestos */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    Puestos disponibles <span style={{ fontWeight: 400, color: '#9ca3af' }}>(uno por línea: nombre|descripción|requisitos)</span>
                  </label>
                  <textarea value={formNuevaConv.puestosTexto} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, puestosTexto: e.target.value })} rows={4} placeholder="Reparto a Pie|Entrega caminando|" style={{ width: '100%', padding: '9px 12px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

                {/* Bloques temario */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    Bloques del temario <span style={{ fontWeight: 400, color: '#9ca3af' }}>(uno por línea: nombre|descripción)</span>
                  </label>
                  <textarea value={formNuevaConv.bloquesTemarioTexto} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, bloquesTemarioTexto: e.target.value })} rows={3} placeholder="Ciencias Jurídicas|Constitución, Penal..." style={{ width: '100%', padding: '9px 12px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

                {/* Bolsa de empleo */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" id="bolsa-nueva" checked={formNuevaConv.generaBolsaEmpleo} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, generaBolsaEmpleo: e.target.checked })} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
                    <label htmlFor="bolsa-nueva" style={{ fontSize: '13px', color: '#374151', cursor: 'pointer' }}>Genera bolsa de empleo</label>
                  </div>
                  {formNuevaConv.generaBolsaEmpleo && (
                    <textarea value={formNuevaConv.bolsaEmpleoDescripcion} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, bolsaEmpleoDescripcion: e.target.value })} rows={2} placeholder="Descripción de cómo funciona la bolsa..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                  )}
                </div>

                {/* Formación posterior */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Formación posterior</label>
                  <textarea value={formNuevaConv.formacionPosterior} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, formacionPosterior: e.target.value })} rows={3} placeholder="Escuela Nacional de Policía (Ávila), 9 meses..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

                {/* Notas adicionales */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Notas adicionales</label>
                  <textarea value={formNuevaConv.descripcionAdicional} onChange={(e) => setFormNuevaConv({ ...formNuevaConv, descripcionAdicional: e.target.value })} rows={3} placeholder="Cualquier información que no encaje en los campos anteriores..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>

              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
                <button onClick={() => crearConv.mutate()} disabled={!formNuevaConv.anyo || crearConv.isPending} style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !formNuevaConv.anyo ? 0.4 : 1 }}>
                  {crearConv.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => setModalNuevaConv(false)} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal editar convocatoria */}
      {modalEditarConv && convEditando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '480px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Editar convocatoria {convEditando.anyo}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '1.25rem' }}>Modifica los datos de esta convocatoria</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Año</label>
                  <input type="number" value={formEditarConv.anyo} onChange={(e) => setFormEditarConv({ ...formEditarConv, anyo: e.target.value })} min="2000" max="2100" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Plazas</label>
                  <input type="number" value={formEditarConv.plazas} onChange={(e) => setFormEditarConv({ ...formEditarConv, plazas: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Estado</label>
                <select value={formEditarConv.estado} onChange={(e) => setFormEditarConv({ ...formEditarConv, estado: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="activa">Activa</option>
                  <option value="cerrada">Cerrada</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fecha examen</label>
                <input type="date" value={formEditarConv.fechaExamen} onChange={(e) => setFormEditarConv({ ...formEditarConv, fechaExamen: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>URL INAP</label>
                <input type="text" value={formEditarConv.urlInap} onChange={(e) => setFormEditarConv({ ...formEditarConv, urlInap: e.target.value })} placeholder="https://sede.inap.gob.es/..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Referencia BOE</label>
                <input type="text" value={formEditarConv.referenciaBoe} onChange={(e) => setFormEditarConv({ ...formEditarConv, referenciaBoe: e.target.value })} placeholder="BOE-A-2025-..." style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Ejercicios de la prueba */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Ejercicios de la prueba</div>
                  <button
                    type="button"
                    onClick={() => setFormEditarConv({
                      ...formEditarConv,
                      ejercicios: [
                        ...formEditarConv.ejercicios,
                        { numero: formEditarConv.ejercicios.length + 1, tipo: 'test', numPreguntas: '', tiempoMinutos: '', descripcion: '' },
                      ],
                    })}
                    style={{ fontSize: '12px', color: '#1F7CFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    + Añadir ejercicio
                  </button>
                </div>

                {formEditarConv.ejercicios.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#9ca3af', padding: '8px 0' }}>Sin ejercicios definidos todavía</div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formEditarConv.ejercicios.map((ej, idx) => (
                    <div key={idx} style={{ background: '#FAFAFA', borderRadius: '10px', padding: '12px', position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setFormEditarConv({
                          ...formEditarConv,
                          ejercicios: formEditarConv.ejercicios.filter((_, i) => i !== idx),
                        })}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '12px', fontWeight: 600 }}
                      >
                        ✕
                      </button>

                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', marginBottom: '8px' }}>Ejercicio {ej.numero}</div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tipo</label>
                          <select
                            value={ej.tipo}
                            onChange={(e) => {
                              const nuevos = [...formEditarConv.ejercicios];
                              nuevos[idx] = { ...ej, tipo: e.target.value };
                              setFormEditarConv({ ...formEditarConv, ejercicios: nuevos });
                            }}
                            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                          >
                            <option value="test">Test</option>
                            <option value="desarrollo">Desarrollo</option>
                            <option value="oral">Oral</option>
                            <option value="practico">Práctico</option>
                            <option value="mixto">Mixto</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nº preguntas</label>
                          <input
                            type="number"
                            value={ej.numPreguntas}
                            onChange={(e) => {
                              const nuevos = [...formEditarConv.ejercicios];
                              nuevos[idx] = { ...ej, numPreguntas: e.target.value };
                              setFormEditarConv({ ...formEditarConv, ejercicios: nuevos });
                            }}
                            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Tiempo (min)</label>
                          <input
                            type="number"
                            value={ej.tiempoMinutos}
                            onChange={(e) => {
                              const nuevos = [...formEditarConv.ejercicios];
                              nuevos[idx] = { ...ej, tiempoMinutos: e.target.value };
                              setFormEditarConv({ ...formEditarConv, ejercicios: nuevos });
                            }}
                            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Descripción</label>
                          <input
                            type="text"
                            value={ej.descripcion}
                            onChange={(e) => {
                              const nuevos = [...formEditarConv.ejercicios];
                              nuevos[idx] = { ...ej, descripcion: e.target.value };
                              setFormEditarConv({ ...formEditarConv, ejercicios: nuevos });
                            }}
                            placeholder="Opcional"
                            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nota mínima</label>
                  <input type="number" step="0.01" value={formEditarConv.notaMinimaAprobado} onChange={(e) => setFormEditarConv({ ...formEditarConv, notaMinimaAprobado: e.target.value })} placeholder="5.00" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fracción penalización</label>
                  <input type="text" value={formEditarConv.fraccionPenalizacion} onChange={(e) => setFormEditarConv({ ...formEditarConv, fraccionPenalizacion: e.target.value })} placeholder="1/3" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Turno */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Turno</label>
                <select value={formEditarConv.turno} onChange={(e) => setFormEditarConv({ ...formEditarConv, turno: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Sin especificar</option>
                  <option value="libre">Libre</option>
                  <option value="promocion_interna">Promoción interna</option>
                </select>
              </div>

              {/* Requisitos */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Requisitos oficiales</label>
                <textarea
                  value={formEditarConv.requisitos}
                  onChange={(e) => setFormEditarConv({ ...formEditarConv, requisitos: e.target.value })}
                  rows={4}
                  placeholder="Nacionalidad española. Edad: desde 18 años..."
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Plazas desglose */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Desglose de plazas</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="number" placeholder="Libres" value={formEditarConv.plazasLibres} onChange={(e) => setFormEditarConv({ ...formEditarConv, plazasLibres: e.target.value })} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  <input type="number" placeholder="Promoción interna" value={formEditarConv.plazasPromocionInterna} onChange={(e) => setFormEditarConv({ ...formEditarConv, plazasPromocionInterna: e.target.value })} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  <input type="number" placeholder="Militares" value={formEditarConv.plazasMilitares} onChange={(e) => setFormEditarConv({ ...formEditarConv, plazasMilitares: e.target.value })} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                  <input type="number" placeholder="Discapacidad" value={formEditarConv.plazasDiscapacidad} onChange={(e) => setFormEditarConv({ ...formEditarConv, plazasDiscapacidad: e.target.value })} style={{ padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Fases adicionales */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Fases del proceso <span style={{ fontWeight: 400, color: '#9ca3af' }}>(una por línea: tipo|nombre|descripción)</span>
                </label>
                <textarea
                  value={formEditarConv.fasesTexto}
                  onChange={(e) => setFormEditarConv({ ...formEditarConv, fasesTexto: e.target.value })}
                  rows={4}
                  placeholder="fisica|Circuito de agilidad|
              psicotecnico|Aptitudes cognitivas|Eliminatorio
              entrevista|Entrevista personal|"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Puestos */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Puestos disponibles <span style={{ fontWeight: 400, color: '#9ca3af' }}>(uno por línea: nombre|descripción|requisitos)</span>
                </label>
                <textarea
                  value={formEditarConv.puestosTexto}
                  onChange={(e) => setFormEditarConv({ ...formEditarConv, puestosTexto: e.target.value })}
                  rows={4}
                  placeholder="Reparto a Pie|Entrega caminando|
              Reparto Motorizado|Entrega en moto o coche|Carnet A1/A2 o B"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Bloques de temario */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Bloques del temario <span style={{ fontWeight: 400, color: '#9ca3af' }}>(uno por línea: nombre|descripción)</span>
                </label>
                <textarea
                  value={formEditarConv.bloquesTemarioTexto}
                  onChange={(e) => setFormEditarConv({ ...formEditarConv, bloquesTemarioTexto: e.target.value })}
                  rows={3}
                  placeholder="Ciencias Jurídicas|Constitución, Penal, Procesal...
              Ciencias Sociales|Historia, geografía, UE..."
                  style={{ width: '100%', padding: '9px 12px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Bolsa de empleo */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" id="bolsa" checked={formEditarConv.generaBolsaEmpleo} onChange={(e) => setFormEditarConv({ ...formEditarConv, generaBolsaEmpleo: e.target.checked })} style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
                  <label htmlFor="bolsa" style={{ fontSize: '13px', color: '#374151', cursor: 'pointer' }}>Genera bolsa de empleo</label>
                </div>
                {formEditarConv.generaBolsaEmpleo && (
                  <textarea
                    value={formEditarConv.bolsaEmpleoDescripcion}
                    onChange={(e) => setFormEditarConv({ ...formEditarConv, bolsaEmpleoDescripcion: e.target.value })}
                    rows={2}
                    placeholder="Descripción de cómo funciona la bolsa..."
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                )}
              </div>

              {/* Formación posterior */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Formación posterior</label>
                <textarea
                  value={formEditarConv.formacionPosterior}
                  onChange={(e) => setFormEditarConv({ ...formEditarConv, formacionPosterior: e.target.value })}
                  rows={3}
                  placeholder="Escuela Nacional de Policía (Ávila), 9 meses..."
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Descripción adicional */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Notas adicionales</label>
                <textarea
                  value={formEditarConv.descripcionAdicional}
                  onChange={(e) => setFormEditarConv({ ...formEditarConv, descripcionAdicional: e.target.value })}
                  rows={3}
                  placeholder="Cualquier información que no encaje en los campos anteriores..."
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Diferencias con convocatoria anterior */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Diferencias respecto a convocatoria anterior</label>
                <textarea
                  value={formEditarConv.diferenciasAnterior}
                  onChange={(e) => setFormEditarConv({ ...formEditarConv, diferenciasAnterior: e.target.value })}
                  rows={3}
                  placeholder="Ej: Se añaden 20 preguntas de informática, se elimina el tema 15..."
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
              <button onClick={() => editarConv.mutate()} disabled={editarConv.isPending} style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                {editarConv.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button onClick={() => { setModalEditarConv(false); setConvEditando(null); }} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar oposición */}
      {modalEditarOpo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '500px', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '1.25rem' }}>Editar oposición</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nombre *</label>
                <input type="text" value={formEditarOpo.nombre} onChange={(e) => setFormEditarOpo({ ...formEditarOpo, nombre: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Administración</label>
                <select
                  value={formEditarOpo.tipoAdministracion}
                  onChange={(e) => setFormEditarOpo({ ...formEditarOpo, tipoAdministracion: e.target.value, administracion: '', categoria: '', subgrupo: '' })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Selecciona...</option>
                  <option value="estado">Estado</option>
                  <option value="ccaa">Comunidad Autónoma</option>
                  <option value="empresa_publica">Empresa pública</option>
                </select>
              </div>

              {formEditarOpo.tipoAdministracion === 'ccaa' && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Comunidad Autónoma</label>
                  <select
                    value={formEditarOpo.administracion}
                    onChange={(e) => setFormEditarOpo({ ...formEditarOpo, administracion: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="">Selecciona...</option>
                    {['Galicia', 'Asturias', 'Cantabria', 'País Vasco', 'Navarra', 'La Rioja', 'Aragón', 'Cataluña', 'Castilla y León', 'Madrid', 'Castilla-La Mancha', 'Extremadura', 'Comunidad Valenciana', 'Murcia', 'Andalucía', 'Baleares', 'Canarias'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {formEditarOpo.tipoAdministracion === 'estado' && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Ministerio</label>
                  <input type="text" value={formEditarOpo.ministerio} onChange={(e) => setFormEditarOpo({ ...formEditarOpo, ministerio: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              )}

              {(formEditarOpo.tipoAdministracion === 'estado' || (formEditarOpo.tipoAdministracion === 'ccaa' && formEditarOpo.administracion)) && (
                <>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categoría</label>
                    <select
                      value={formEditarOpo.categoria}
                      onChange={(e) => setFormEditarOpo({ ...formEditarOpo, categoria: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="">Sin categoría</option>
                      {(formEditarOpo.tipoAdministracion === 'estado'
                        ? [{ value: 'administracion_general', label: 'AGE' }, { value: 'seguridad', label: 'Seguridad' }, { value: 'justicia', label: 'Justicia' }, { value: 'sanidad', label: 'Sanidad' }]
                        : [{ value: 'administracion_general', label: 'Administración' }, { value: 'seguridad', label: 'Seguridad' }, { value: 'sanidad', label: 'Sanidad' }]
                      ).map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>Subgrupo</label>
                    <select value={formEditarOpo.subgrupo} onChange={(e) => setFormEditarOpo({ ...formEditarOpo, subgrupo: e.target.value })} style={{ width: '100%', padding: '9px 12px', fontSize: '13px', border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">Sin subgrupo</option>
                      {['A1', 'A2', 'C1', 'C2', 'E'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
              <button onClick={() => editarOpo.mutate()} disabled={!formEditarOpo.nombre || editarOpo.isPending} style={{ flex: 2, padding: '10px', background: '#111827', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: !formEditarOpo.nombre ? 0.4 : 1 }}>
                {editarOpo.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button onClick={() => setModalEditarOpo(false)} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
  
}
