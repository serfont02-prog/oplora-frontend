'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

type TipoAdministracion = 
  | 'estado'
  | 'ccaa'
  | 'local'
  | 'empresa_publica';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string;
  rol: string;
  tipoAvatar?: 'oplo' | 'foto';
  avatarUrl?: string | null;

  //¿Completo en onboarding general
  onboardingGeneralCompletado?: boolean;


  // Datos de progreso
  puntos: number;
  nivel: number;
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
  actualizarUsuario: (data: Partial<Usuario>) => void; // ⭐ Añadido
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // ⭐ Función añadida correctamente
  const actualizarUsuario = (data: Partial<Usuario>) => {
    setUsuario((prev) => (prev ? { ...prev, ...data } : prev));
  };

  useEffect(() => {
  const tokenGuardado = localStorage.getItem('token');

  if (tokenGuardado) {
    setToken(tokenGuardado);
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenGuardado}`;

    api
      .get('/usuarios/me')   // ⭐ AHORA SÍ TRAE oposicionActiva, suscripcion, estado, etc.
      .then((res) => {
  setUsuario(res.data);
})
      .catch(() => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0';
        setToken(null);
      })
      .finally(() => setCargando(false));
  } else {
    setCargando(false);
  }
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
