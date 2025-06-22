// Tipos para la tabla personajes
export interface Personaje {
  id: string;
  nombre: string;
  edad: number;
  atributo: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para la tabla rangosEdad
export interface RangoEdad {
  id: string;
  nombre_rango: string;
  edad_minima: number;
  edad_maxima: number;
}

// Tipos para la tabla datosFusionados
export interface DatoFusionado {
  id: string;
  nombre: string;
  edad: number;
  atributo: string;
  nombre_rango: string;
  fecha_fusion: string;
}

// Tipo para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: DatoFusionado;
  error?: string;
  details?: string[];
}

// Tipo para el resultado de validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  nombre?: string;
} 