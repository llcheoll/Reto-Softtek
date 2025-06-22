// Tipos para la tabla datosFusionados
export interface DatoFusionado {
  id: string;
  nombre: string;
  edad: number;
  atributo: string;
  nombre_rango: string;
  fecha_fusion: string;
}

interface PaginatedData {
  datosFusionados: DatoFusionado[];
  page: number;
  total: number;
  totalPages: number;
}

// Tipo para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: PaginatedData;
  error?: string;
}

// Tipos para el sistema de caché
export interface CacheEntry {
  cacheKey: string;
  data: any;
  ttl: number; // Timestamp en segundos desde epoch
}

export interface CacheResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  fromCache?: boolean;
} 