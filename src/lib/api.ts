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

  // ⭐ Sesión caducada o cuenta desactivada: antes las pantallas se quedaban vacías.
  // Ante un 401 (fuera de login/registro) se borra la sesión y se vuelve al login con aviso.
  let redirigiendo = false;
  api.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error?.response?.status;
      const url: string = error?.config?.url ?? '';
      if (status === 401 && typeof window !== 'undefined' && !url.startsWith('/auth/')) {
        const teniaSesion = !!localStorage.getItem('token');
        if (teniaSesion && !redirigiendo) {
          redirigiendo = true;
          localStorage.removeItem('token');
          document.cookie = 'token=; path=/; max-age=0';
          delete api.defaults.headers.common['Authorization'];
          const m = error?.response?.data?.message;
          try {
            sessionStorage.setItem(
              'oplora-aviso-login',
              typeof m === 'string' && /desactivada|contraseña ha cambiado/i.test(m) ? m : 'Tu sesión ha caducado. Vuelve a entrar.',
            );
          } catch { /* sin sessionStorage */ }
          if (!window.location.pathname.startsWith('/app/login')) {
            window.location.href = '/app/login';
          } else {
            redirigiendo = false;
          }
        }
      }
      return Promise.reject(error);
    },
  );

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
    urlOficial?: string;
    urlOficialNoAplica?: boolean;
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