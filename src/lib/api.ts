import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Tipos
export interface Oposicion {
  id: string;
  nombre: string;
  cuerpo?: string;
  administracion?: string;
  ministerio?: string;
  activa: boolean;
  creadoEn: string;
  totalConvocatorias?: number;
  totalLeyes?: number;
}

export interface Convocatoria {
  id: string;
  anyo: number;
  plazas?: number;
  estado: 'activa' | 'cerrada' | 'borrador';
  fechaExamen?: string;
  urlInap?: string;
  referenciaBoe?: string;
  plazoInscripcionInicio?: string;
  plazoInscripcionFin?: string;
  documentos?: DocumentoConvocatoria[];
}

export interface DocumentoConvocatoria {
  id: string;
  titulo: string;
  tipo: string;
  subtipo?: string;
  urlPdf: string;
  procesado: boolean;
  detectadoEn: string;
}