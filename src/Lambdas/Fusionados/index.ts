import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Personaje, RangoEdad, DatoFusionado, ApiResponse, ValidationResult } from "./types";
import { clearAllCache } from "./cache-utils";

// Cliente de DynamoDB
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Función para validar el parámetro nombre
function validarNombre(nombre: string): ValidationResult {
  const errors: string[] = [];

  if (!nombre || typeof nombre !== 'string') {
    errors.push('El parámetro "nombre" es obligatorio y debe ser una cadena de texto');
  } else if (nombre.trim().length === 0) {
    errors.push('El parámetro "nombre" no puede estar vacío');
  } else if (nombre.length > 50) {
    errors.push('El parámetro "nombre" no puede exceder 50 caracteres');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    nombre: nombre.trim()
  };
}

// Función para obtener un personaje por nombre
async function obtenerPersonaje(nombre: string): Promise<Personaje | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: process.env['PERSONAJES_TABLE_NAME'],
      Key: { nombre: nombre }
    }));

    return result.Item as Personaje || null;
  } catch (error) {
    console.error('Error al obtener personaje:', error);
    throw error;
  }
}

// Función para obtener todos los rangos de edad
async function obtenerRangosEdad(): Promise<RangoEdad[]> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: process.env['RANGOSEDAD_TABLE_NAME'],
    }));

    return result.Items as RangoEdad[] || [];
  } catch (error) {
    console.error('Error al obtener rangos de edad:', error);
    throw error;
  }
}

// Función para encontrar el rango de edad correspondiente
function encontrarRangoEdad(edad: number, rangos: RangoEdad[]): RangoEdad | null {
  return rangos.find(rango => 
    edad >= rango.edad_minima && edad <= rango.edad_maxima
  ) || null;
}

// Función para guardar datos fusionados
async function guardarDatosFusionados(datoFusionado: DatoFusionado): Promise<DatoFusionado> {
  try {
    await docClient.send(new PutCommand({
      TableName: process.env['DATOSFUSIONADOS_TABLE_NAME'],
      Item: datoFusionado
    }));

    return datoFusionado;
  } catch (error) {
    console.error('Error al guardar datos fusionados:', error);
    throw error;
  }
}

// Función para obtener un dato fusionado existente por nombre
async function obtenerDatoFusionadoExistente(nombre: string): Promise<DatoFusionado | null> {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: process.env['DATOSFUSIONADOS_TABLE_NAME'],
      IndexName: 'NombreIndex',
      KeyConditionExpression: 'nombre = :nombre',
      ExpressionAttributeValues: {
        ':nombre': nombre,
      },
    }));

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as DatoFusionado;
    }
    return null;
  } catch (error) {
    console.error('Error al verificar datos fusionados existentes:', error);
    throw error;
  }
}

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
  console.log('Evento recibido:', JSON.stringify(event, undefined, 2));

  try {
    // Verificar que sea una petición GET
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET'
        },
        body: JSON.stringify({
          success: false,
          message: 'Método no permitido. Solo se acepta GET.',
          error: 'METHOD_NOT_ALLOWED'
        } as ApiResponse)
      };
    }

    // Obtener el parámetro nombre de la query string
    const nombre = event.queryStringParameters?.['nombre'];

    // Validar el parámetro nombre
    const validacion = validarNombre(nombre || '');
    if (!validacion.isValid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET'
        },
        body: JSON.stringify({
          success: false,
          message: 'Parámetro inválido',
          error: 'VALIDATION_ERROR',
          details: validacion.errors
        } as ApiResponse)
      };
    }

    const nombrePersonaje = validacion.nombre!;

    // Obtener el personaje
    const personaje = await obtenerPersonaje(nombrePersonaje);
    if (!personaje) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET'
        },
        body: JSON.stringify({
          success: false,
          message: `No existe un personaje con el nombre "${nombrePersonaje}"`,
          error: 'PERSONAJE_NOT_FOUND'
        } as ApiResponse)
      };
    }

    // Obtener todos los rangos de edad
    const rangosEdad = await obtenerRangosEdad();
    if (rangosEdad.length === 0) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET'
        },
        body: JSON.stringify({
          success: false,
          message: 'No se encontraron rangos de edad configurados',
          error: 'RANGOS_EDAD_NOT_FOUND'
        } as ApiResponse)
      };
    }

    // Encontrar el rango de edad correspondiente
    const rangoEdad = encontrarRangoEdad(personaje.edad, rangosEdad);
    if (!rangoEdad) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET'
        },
        body: JSON.stringify({
          success: false,
          message: `No se encontró un rango de edad válido para la edad ${personaje.edad}`,
          error: 'RANGO_EDAD_NOT_FOUND'
        } as ApiResponse)
      };
    }

    // Verificar si ya existe un registro para actualizar o si se debe crear uno nuevo
    const datoExistente = await obtenerDatoFusionadoExistente(personaje.nombre);
    const esActualizacion = !!datoExistente;

    // Crear el dato fusionado
    const datoFusionado: DatoFusionado = {
      id: esActualizacion ? datoExistente.id : uuidv4(),
      nombre: personaje.nombre,
      edad: personaje.edad,
      atributo: personaje.atributo,
      nombre_rango: rangoEdad.nombre_rango,
      fecha_fusion: new Date().toISOString(),
    };

    // Guardar en la tabla datosFusionados (crea o reemplaza)
    const datoGuardado = await guardarDatosFusionados(datoFusionado);

    // Limpiar el caché después de modificar los datos
    console.log('Limpiando caché después de modificar datos fusionados');
    await clearAllCache();

    const mensaje = esActualizacion
      ? 'Datos fusionados actualizados exitosamente'
      : 'Datos fusionados creados exitosamente';

    return {
      statusCode: esActualizacion ? 200 : 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET'
      },
      body: JSON.stringify({
        success: true,
        message: mensaje,
        data: datoGuardado
      } as ApiResponse)
    };

  } catch (error) {
    console.error('Error en la lambda Fusionados:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET'
      },
      body: JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
        error: 'INTERNAL_SERVER_ERROR'
      } as ApiResponse)
    };
  }
}; 