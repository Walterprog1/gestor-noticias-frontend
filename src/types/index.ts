export interface User {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  rol: 'administrador' | 'operador' | 'analista';
  sector_asignado: string | null;
  activo: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface Fuente {
  id: number;
  nombre: string;
  url_base: string;
  secciones: { nombre: string; url: string }[];
  horarios_escaneo: string[];
  sector: string | null;
  selectores_config: { link_selector?: string; contenido_selector?: string; fecha_selector?: string };
  estado: string;
  ultimo_error: string | null;
  activa: boolean;
  ultimo_escaneo: string | null;
  articulos_extraidos_total: number;
  created_at: string;
}

export interface Registro {
  id: number;
  articulo_id: number;
  fuente: string;
  fecha: string | null;
  link: string;
  que: string | null;
  que_origen: string;
  quien: string | null;
  quien_origen: string;
  porque: string | null;
  porque_origen: string;
  datos: string | null;
  datos_origen: string;
  titulo: string | null;
  titulo_origen: string;
  tags: string | null;
  tags_origen: string;
  sector: string | null;
  sector_origen: string;
  orbita: string | null;
  orbita_origen: string;
  genero: string | null;
  ambito: string | null;
  region: string | null;
  estado: string;
  motivo_rechazo: string | null;
  operador_id: number | null;
  sector_operador: string | null;
  fecha_aprobacion: string | null;
  correcciones_json: Correccion[];
  created_at: string;
  texto_crudo?: string | null;
  titulo_original?: string | null;
}

export interface Correccion {
  campo: string;
  valor_ia: string;
  valor_operador: string;
  usuario: string;
  timestamp: string;
}

export interface Prompt {
  id: number;
  nombre: string;
  descripcion: string | null;
  contenido: string;
  version: number;
  activo: boolean;
  tipo: string;
  created_at: string;
}

export interface ScanStatus {
  total_articulos: number;
  crudo: number;
  filtrado: number;
  procesado: number;
  no_relevante: number;
}

export const SECTORES = ['AGENDA', 'INDUSTRIAL', 'AGRO', 'ENERGÍA', 'FINANZAS', 'TRABAJADORES'];
export const ORBITAS = ['POLÍTICA', 'ECONOMÍA', 'ESTRATEGIA'];
export const GENEROS = ['nota', 'opinión'];
export const AMBITOS = ['provincial', 'nacional', 'latinoamericano', 'internacional'];
