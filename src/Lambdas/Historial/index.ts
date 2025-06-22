import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ApiResponse, DatoFusionado } from "./types";
import { getFromCache, saveToCache, generateCacheKey } from "./cache-utils";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
  console.log('Evento recibido en Historial:', JSON.stringify(event, undefined, 2));

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'N/A'
      },
      body: JSON.stringify({
        success: false,
        message: 'Método no permitido. Solo se acepta GET.',
        error: 'METHOD_NOT_ALLOWED'
      } as ApiResponse),
    };
  }

  try {
    // 1. Validar y obtener parámetros de paginación
    const page = parseInt(event.queryStringParameters?.['page'] || '1', 10);
    const limit = parseInt(event.queryStringParameters?.['limit'] || '10', 10);

    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'N/A'
        },
        body: JSON.stringify({
          success: false,
          message: 'Parámetros de paginación inválidos. "page" y "limit" deben ser números positivos.',
          error: 'VALIDATION_ERROR',
        }),
      };
    }

    // 2. Generar clave del caché basada en los parámetros
    const cacheKey = generateCacheKey('historial', { page, limit });
    
    // 3. Intentar obtener datos del caché
    const cachedData = await getFromCache(cacheKey);
    
    if (cachedData) {
      console.log('Devolviendo datos desde caché');
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT'
        },
        body: JSON.stringify({
          success: true,
          message: 'Historial obtenido exitosamente desde caché',
          data: cachedData,
          fromCache: true
        } as ApiResponse),
      };
    }

    // 4. Si no hay caché, obtener datos de la tabla
    console.log('Obteniendo datos desde DynamoDB');
    const scanResult = await docClient.send(new ScanCommand({
      TableName: process.env['DATOSFUSIONADOS_TABLE_NAME'],
    }));

    const allItems = scanResult.Items as DatoFusionado[] || [];
    const totalItems = allItems.length;

    // 5. Aplicar paginación a los resultados
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = allItems.slice(startIndex, endIndex);

    const responseData = {
      datosFusionados: paginatedItems,
      page: page,
      total: totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };

    // 6. Guardar en caché para futuras consultas
    await saveToCache(cacheKey, responseData);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Historial obtenido exitosamente',
        data: responseData,
        fromCache: false
      } as ApiResponse),
    };

  } catch (error) {
    console.error('Error al obtener el historial de datos fusionados:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'N/A'
      },
      body: JSON.stringify({
        success: false,
        message: 'Error interno del servidor al obtener el historial.',
        error: 'INTERNAL_SERVER_ERROR',
      } as ApiResponse),
    };
  }
}; 