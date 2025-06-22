import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { CacheEntry } from "./types";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CACHE_TTL_MINUTES = 30; // 30 minutos de TTL

// Función para calcular el TTL (30 minutos desde ahora)
export function calculateTTL(): number {
  return Math.floor(Date.now() / 1000) + (CACHE_TTL_MINUTES * 60);
}

// Función para obtener datos del caché
export async function getFromCache(cacheKey: string): Promise<any | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: process.env['CACHE_TABLE_NAME'],
      Key: { cacheKey }
    }));

    if (result.Item) {
      const cacheEntry = result.Item as CacheEntry;
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Verificar si el TTL no ha expirado
      if (cacheEntry.ttl > currentTime) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return cacheEntry.data;
      } else {
        console.log(`Cache expired for key: ${cacheKey}`);
        // Eliminar el elemento expirado
        await deleteFromCache(cacheKey);
        return null;
      }
    }
    
    console.log(`Cache miss for key: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
}

// Función para guardar datos en el caché
export async function saveToCache(cacheKey: string, data: any): Promise<void> {
  try {
    const cacheEntry: CacheEntry = {
      cacheKey,
      data,
      ttl: calculateTTL()
    };

    await docClient.send(new PutCommand({
      TableName: process.env['CACHE_TABLE_NAME'],
      Item: cacheEntry
    }));

    console.log(`Data saved to cache with key: ${cacheKey}`);
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

// Función para eliminar datos del caché
export async function deleteFromCache(cacheKey: string): Promise<void> {
  try {
    await docClient.send(new DeleteCommand({
      TableName: process.env['CACHE_TABLE_NAME'],
      Key: { cacheKey }
    }));

    console.log(`Data deleted from cache with key: ${cacheKey}`);
  } catch (error) {
    console.error('Error deleting from cache:', error);
  }
}

// Función para limpiar todo el caché
export async function clearAllCache(): Promise<void> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: process.env['CACHE_TABLE_NAME']
    }));

    if (result.Items && result.Items.length > 0) {
      const deletePromises = result.Items.map(item => 
        docClient.send(new DeleteCommand({
          TableName: process.env['CACHE_TABLE_NAME'],
          Key: { cacheKey: item.cacheKey }
        }))
      );

      await Promise.all(deletePromises);
      console.log(`Cleared ${result.Items.length} cache entries`);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Función para generar la clave del caché basada en parámetros
export function generateCacheKey(endpoint: string, params?: Record<string, any>): string {
  const baseKey = `cache_${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${baseKey}_${sortedParams}`;
  }
  
  return baseKey;
} 