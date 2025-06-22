// Tipos para la validación de entrada
export interface PersonajeInput {
  nombre: string;
  edad: number;
  atributo: string;
  id?: string;
  createdAt?: string;
}

// Tipo para el personaje completo en la base de datos
export interface Personaje {
  id: string;
  nombre: string;
  edad: number;
  atributo: string;
  createdAt: string;
  updatedAt: string;
}

// Tipo para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  message: string;
  data?: Personaje;
  error?: string;
  details?: string[];
}

// Tipo para el resultado de validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  personaje?: PersonajeInput;
} 