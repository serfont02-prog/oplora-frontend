'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

const tiposNorma = [
  'Ley orgánica',
  'Ley ordinaria',
  'Real Decreto Legislativo',
  'Real Decreto',
  'Instrucción / Circular',
  'Otra',
];

export default function NuevaLeyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<any>(null);
  const [oposicionesSeleccionadas, setOposicionesSeleccionadas] = useState<string[]>([]);
  const [form, setForm] = useState({
    nombre: '',
    referenciaBoe: '',
    tipoNorma: '',
    fechaPublicacion: '',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  const { data: oposiciones = [] } = useQuery({
    queryKey: ['oposiciones'],
    queryFn: async () => {
      const res = await api.get('/oposiciones');
      return res.data;
    },
  });

  const subir = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      if (oposicionesSeleccionadas.length > 0) {
      formData.append('oposicionIds', JSON.stringify(oposicionesSeleccionadas));
      }
      if (form.referenciaBoe) formData.append('referenciaBoe', form.referenciaBoe);
      if (form.tipoNorma) formData.append('tipoNorma', form.tipoNorma);
      if (form.fechaPublicacion) formData.append('fechaPublicacion', form.fechaPublicacion);
      if (archivo) formData.append('archivo', archivo);

      const res = await api.post('/leyes/subir', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return res.data;
    },
    onSuccess: async (data) => {
      setResultado(data);

      for (const oposicionId of oposicionesSeleccionadas) {
        await api.post('/leyes/vincular', {
          leyId: data.ley.id,
          oposicionId,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['leyes'] });
    },
  });

  const validar = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!archivo) e.archivo = 'Selecciona un archivo PDF o TXT';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setArchivo(f);
      setErrores((prev) => ({ ...prev, archivo: '' }));

      if (!form.nombre) {
        const nombre = f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        setForm((prev) => ({ ...prev, nombre }));
      }
    }
  };

  const toggleOposicion = (id: string) => {
    setOposicionesSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ---------------------------
  // RESULTADO FINAL
  // ---------------------------
  if (resultado) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/leyes')}
            className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Leyes
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-[13px] text-gray-500">Ley subida</span>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <CheckCircle size={48} className="text-green-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Ley subida correctamente
          </h2>
          <p className="text-gray-500 mb-6">{resultado.ley?.nombre}</p>

          <button
            onClick={() => router.push('/admin/leyes')}
            className="px-4 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver a Leyes
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------
  // FORMULARIO PRINCIPAL
  // ---------------------------
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/leyes')}
          className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Leyes
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-[13px] text-gray-500">Nueva Ley</span>
      </div>

      {/* Formulario */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto flex flex-col gap-6">

          {/* Nombre */}
          <div>
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {errores.nombre && (
              <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
            )}
          </div>

          {/* Archivo */}
          <div>
            <label className="text-sm font-medium text-gray-700">Archivo</label>

            <div
              onClick={() => fileRef.current?.click()}
              className="mt-1 border border-gray-300 rounded-lg px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
            >
              <Upload size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {archivo ? archivo.name : 'Seleccionar archivo'}
              </span>
            </div>

            <input
              type="file"
              ref={fileRef}
              className="hidden"
              accept=".pdf,.txt"
              onChange={handleFile}
            />

            {errores.archivo && (
              <p className="text-red-500 text-xs mt-1">{errores.archivo}</p>
            )}
          </div>

          {/* Tipo de norma */}
          <div>
            <label className="text-sm font-medium text-gray-700">Tipo de norma</label>
            <select
              value={form.tipoNorma}
              onChange={(e) => setForm({ ...form, tipoNorma: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Seleccionar...</option>
              {tiposNorma.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Fecha publicación */}
          <div>
            <label className="text-sm font-medium text-gray-700">Fecha publicación</label>
            <input
              type="date"
              value={form.fechaPublicacion}
              onChange={(e) => setForm({ ...form, fechaPublicacion: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Oposiciones */}
          <div>
            <label className="text-sm font-medium text-gray-700">Vincular a oposiciones</label>

            <div className="mt-2 flex flex-col gap-2">
              {oposiciones.map((o: any) => (
                <label key={o.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={oposicionesSeleccionadas.includes(o.id)}
                    onChange={() => toggleOposicion(o.id)}
                  />
                  {o.nombre}
                </label>
              ))}
            </div>
          </div>

          {/* Botón enviar */}
          <button
            onClick={() => validar() && subir.mutate()}
            disabled={subir.isPending}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            {subir.isPending ? 'Subiendo...' : 'Subir Ley'}
          </button>
        </div>
      </div>
    </div>
  );
}
