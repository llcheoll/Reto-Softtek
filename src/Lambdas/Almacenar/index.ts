import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { PersonajeInput, Personaje, ApiResponse, ValidationResult } from "./types";

// Cliente de DynamoDB
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Función para validar los datos de entrada
function validarPersonaje(data: any): ValidationResult {
  const errors: string[] = [];

  // Validar que sea un objeto
  if (!data || typeof data !== 'object') {
    errors.push('Los datos deben ser un objeto válido');
    return { isValid: false, errors };
  }

  // Validar nombre
  if (!data.nombre || typeof data.nombre !== 'string') {
    errors.push('El campo "nombre" es obligatorio y debe ser una cadena de texto');
  } else if (data.nombre.length > 50) {
    errors.push('El campo "nombre" no puede exceder 50 caracteres');
  } else if (data.nombre.trim().length === 0) {
    errors.push('El campo "nombre" no puede estar vacío');
  }

  // Validar edad
  if (data.edad === undefined || data.edad === null) {
    errors.push('El campo "edad" es obligatorio');
  } else if (typeof data.edad !== 'number') {
    errors.push('El campo "edad" debe ser un número');
  } else if (data.edad <= 0) {
    errors.push('El campo "edad" debe ser mayor a 0');
  }

  // Validar atributo
  if (!data.atributo || typeof data.atributo !== 'string') {
    errors.push('El campo "atributo" es obligatorio y debe ser una cadena de texto');
  } else if (data.atributo.length > 50) {
    errors.push('El campo "atributo" no puede exceder 50 caracteres');
  } else if (data.atributo.trim().length === 0) {
    errors.push('El campo "atributo" no puede estar vacío');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    personaje: {
      nombre: data.nombre.trim(),
      edad: data.edad,
      atributo: data.atributo.trim()
    }
  };
}

// Función para verificar si existe un personaje por nombre
async function verificarPersonajeExistente(nombre: string): Promise<Personaje | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: process.env.PERSONAJES_TABLE_NAME,
      Key: { nombre: nombre }
    }));

    return result.Item as Personaje || null;
  } catch (error) {
    console.error('Error al verificar personaje existente:', error);
    throw error;
  }
}

// Función para guardar o actualizar un personaje
async function guardarPersonaje(personajeData: PersonajeInput, esActualizacion: boolean = false): Promise<Personaje> {
  const now = new Date().toISOString();
  
  const personaje: Personaje = {
    id: esActualizacion ? (personajeData.id || uuidv4()) : uuidv4(),
    nombre: personajeData.nombre,
    edad: personajeData.edad,
    atributo: personajeData.atributo,
    createdAt: esActualizacion ? (personajeData.createdAt || now) : now,
    updatedAt: now
  };

  try {
    await docClient.send(new PutCommand({
      TableName: process.env.PERSONAJES_TABLE_NAME,
      Item: personaje
    }));

    return personaje;
  } catch (error) {
    console.error('Error al guardar personaje:', error);
    throw error;
  }
}

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
  console.log('Evento recibido:', JSON.stringify(event, undefined, 2));

  try {
    // Verificar que sea una petición POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST'
        },
        body: JSON.stringify({
          success: false,
          message: 'Método no permitido. Solo se acepta POST.',
          error: 'METHOD_NOT_ALLOWED'
        } as ApiResponse)
      };
    }

    // Parsear el cuerpo de la petición
    let body: any;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST'
        },
        body: JSON.stringify({
          success: false,
          message: 'Cuerpo de la petición inválido. Debe ser JSON válido.',
          error: 'INVALID_JSON'
        } as ApiResponse)
      };
    }

    // Validar los datos de entrada
    const validacion = validarPersonaje(body);
    if (!validacion.isValid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST'
        },
        body: JSON.stringify({
          success: false,
          message: 'Datos de entrada inválidos',
          error: 'VALIDATION_ERROR',
          details: validacion.errors
        } as ApiResponse)
      };
    }

    const personajeInput = validacion.personaje!;

    // Verificar si ya existe un personaje con el mismo nombre
    const personajeExistente = await verificarPersonajeExistente(personajeInput.nombre);
    
    let personajeGuardado: Personaje;
    let mensaje: string;

    if (personajeExistente) {
      // Actualizar personaje existente
      personajeGuardado = await guardarPersonaje({
        ...personajeInput,
        id: personajeExistente.id,
        createdAt: personajeExistente.createdAt
      }, true);
      mensaje = 'Personaje actualizado exitosamente';
    } else {
      // Crear nuevo personaje
      personajeGuardado = await guardarPersonaje(personajeInput);
      mensaje = 'Personaje creado exitosamente';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({
        success: true,
        message: mensaje,
        data: personajeGuardado
      } as ApiResponse)
    };

  } catch (error) {
    console.error('Error en el handler:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      } as ApiResponse)
    };
  }
};
