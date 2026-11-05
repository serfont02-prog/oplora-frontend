'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

type TipoAdministracion = 
  | 'estado'
  | 'ccaa'
  | 'local'
  | 'empresa_publica';

  interface ConvocatoriaActiva {
  id: string;
  anyo: number;
  estado: string;
  plazas?: number;
}

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string;
  rol: string;
  tipoAvatar?: 'oplo' | 'foto';
  avatarUrl?: string | null;
  copaLiga?: { color: string; veces: number; total: number } | null; // Liga Oplora
  nick?: string;

  //¿Completo en onboarding general
  onboardingGeneralCompletado?: boolean;


  // Datos de progreso
  estado: string;          // "nuevo" | "iniciado" | "activo"
  rachaActual: number;

  // Onboarding
  objetivo?: string;
  tiempoDisponible?: string;

  // Oposición activa
  oposicionActiva?: {
    id: string;
    nombre: string;
    subgrupo: string;
    turno: string;
    tipoAdministracion: TipoAdministracion;
    puntos: number;
    nivel: number;
    convocatoriaActiva?: ConvocatoriaActiva | null;
    nivelExperiencia?: number;
  };

  // Suscripción del usuario
  suscripcion?: string;    // "gratuito" | "esencial" | "profesional"
}


interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  registro: (datos: any) => Promise<any>;
  logout: () => void;
  cargando: boolean;
  actualizarUsuario: (data: Partial<Usuario>) => void; 
}

const AuthContext = createContext<AuthContextType | null>(null);

// ⭐ Copia del usuario en el móvil para entrar al momento: al abrir la app se enseña el inicio con
// lo guardado y la sesión se comprueba por detrás (si ha caducado, se va al login como siempre).
const CLAVE_USUARIO = 'oplora-usuario';
function leerUsuarioGuardado(): Usuario | null {
  try {
    const t = localStorage.getItem(CLAVE_USUARIO);
    return t ? (JSON.parse(t) as Usuario) : null;
  } catch {
    return null;
  }
}
function guardarUsuario(u: Usuario | null) {
  try {
    if (u) localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u));
    else localStorage.removeItem(CLAVE_USUARIO);
  } catch { /* sin almacenamiento: solo se pierde la entrada rápida */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const actualizarUsuario = (data: Partial<Usuario>) => {
    setUsuario((prev) => (prev ? { ...prev, ...data } : prev));
  };

  // Cada vez que cambian los datos del usuario se actualiza la copia guardada.
  useEffect(() => {
    if (usuario) guardarUsuario(usuario);
  }, [usuario]);

  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');

    if (!tokenGuardado) {
      guardarUsuario(null);
      setCargando(false);
      return;
    }

    setToken(tokenGuardado);
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenGuardado}`;

    // Si ya había entrado antes en este móvil, se entra al momento con lo guardado.
    const guardado = leerUsuarioGuardado();
    if (guardado) {
      setUsuario(guardado);
      setCargando(false);
    }

    api
      .get('/usuarios/me')
      .then((res) => setUsuario(res.data))
      .catch((err) => {
        const status = err?.response?.status;
        // Sin conexión o servidor caído con datos guardados: se sigue con ellos.
        if (guardado && (!status || status >= 500)) return;
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0';
        guardarUsuario(null);
        setToken(null);
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);


  // LOGIN
  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token } = res.data;

    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const perfil = await api.get('/usuarios/me');

    setToken(token);
    setUsuario(perfil.data);

    return { ...res.data, usuario: perfil.data };
  };

  // REGISTRO
  const registro = async (datos: any) => {
    const res = await api.post('/auth/registro', datos);
    const { token } = res.data;

    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const perfil = await api.get('/usuarios/me');

    setToken(token);
    setUsuario(perfil.data);

    return { ...res.data, usuario: perfil.data };
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    guardarUsuario(null);
    document.cookie = 'token=; path=/; max-age=0';
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        registro,
        logout,
        cargando,
        actualizarUsuario, // ⭐ Ahora sí está expuesto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
