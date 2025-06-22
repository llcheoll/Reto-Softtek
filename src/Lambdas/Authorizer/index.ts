import { APIGatewayTokenAuthorizerHandler, APIGatewayAuthorizerResult } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// Cliente de DynamoDB para caché
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Tu lógica de validación adaptada
const tokenPrefix = 'Bearer ';
const secret = process.env.JWT_SECRET_API_GATEWAY; // <-- Volvemos a usar la variable de entorno

const extractToken = (authorization: string): string => {
  if (!authorization) {
    throw new Error('Authorization header is required');
  }
  if (!authorization.startsWith(tokenPrefix)) {
    throw new Error('Invalid authorization header format');
  }
  return authorization.slice(tokenPrefix.length);
};

const validateToken = (token: string): jwt.JwtPayload => {
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }
  try {
    return jwt.verify(token, secret) as jwt.JwtPayload;
  } catch (error) {
    console.error('Token validation error:'+error);
    // Para que API Gateway devuelva 401, simplemente lanzamos un error con este texto.
    throw new Error('Token validation error:'+ error+' Token: '+token+' Secret: '+secret);
  }
};

// Función para verificar si es el endpoint /historial
function isHistorialEndpoint(methodArn: string): boolean {
  // El methodArn tiene el formato: arn:aws:execute-api:region:account:api-id/stage/HTTP-VERB/resource
  const parts = methodArn.split('/');
  const resource = parts[parts.length - 1];
  return resource === 'historial';
}

// Función para obtener datos del caché
async function getFromCache(cacheKey: string): Promise<any | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: process.env['CACHE_TABLE_NAME'],
      Key: { cacheKey }
    }));

    if (result.Item) {
      const cacheEntry = result.Item as any;
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Verificar si el TTL no ha expirado
      if (cacheEntry.ttl > currentTime) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return cacheEntry.data;
      } else {
        console.log(`Cache expired for key: ${cacheKey}`);
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

// Función para generar la clave del caché
function generateCacheKey(endpoint: string, params?: Record<string, any>): string {
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

// Función para generar la política de IAM
const generatePolicy = (principalId: string, effect: 'Allow' | 'Deny', resource: string): APIGatewayAuthorizerResult => {
  // Generar una política más permisiva que permita acceso a todos los recursos del API
  const apiResource = resource.split('/')[0] + '/*';
  
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: apiResource,
        },
      ],
    },
  };
};

export const handler: APIGatewayTokenAuthorizerHandler = async (event) => {
  console.log('--- Authorizer Start ---');
  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log('Method ARN:', event.methodArn);
  console.log('Authorization token length:', event.authorizationToken?.length || 0);

  // LOG PARA DEPURACIÓN: Mostrar el secreto que la Lambda está usando
  console.log('Secret loaded from environment:', secret);

  try {
    const token = extractToken(event.authorizationToken);
    
    // LOG PARA DEPURACIÓN: Mostrar el token extraído
    console.log('Extracted token:', token);
    
    const decoded = validateToken(token);
    
    console.log(`Validation successful for principal: ${decoded.sub}. Granting access.`);
    console.log('Generated policy for resource:', event.methodArn);

    // Verificar si es el endpoint /historial
    if (isHistorialEndpoint(event.methodArn)) {
      console.log('Endpoint /historial detectado, verificando caché...');
      
      // Generar clave del caché (asumiendo parámetros por defecto)
      const cacheKey = generateCacheKey('historial', { page: 1, limit: 10 });
      
      // Intentar obtener datos del caché
      const cachedData = await getFromCache(cacheKey);
      
      if (cachedData) {
        console.log('Datos encontrados en caché, devolviendo respuesta directa');
        // En este caso, podríamos devolver una respuesta especial
        // pero por ahora solo logueamos que hay caché disponible
      } else {
        console.log('No hay datos en caché, la lambda de Historial se ejecutará normalmente');
      }
    }

    return generatePolicy(decoded.sub || 'user', 'Allow', event.methodArn);

  } catch (error: any) {
    console.error(`Authorization failed: ${error.message}`);
    console.error('Full error details:', error);
    // En lugar de lanzar un error, devolvemos una política de denegación
    return generatePolicy('unauthorized', 'Deny', event.methodArn);
  }
}; 