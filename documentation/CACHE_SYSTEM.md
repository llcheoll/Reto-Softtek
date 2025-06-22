# Sistema de Caché con Amazon DynamoDB

## Descripción General

Este sistema implementa un caché temporal usando Amazon DynamoDB con TTL (Time To Live) para optimizar las consultas al endpoint `/historial`. El caché tiene una duración máxima de 30 minutos y se invalida automáticamente cuando se modifican datos a través del endpoint `/fusionados`.

## Arquitectura

### Tabla de Caché (`cacheTable`)

- **Clave primaria**: `cacheKey` (String)
- **TTL**: Campo `ttl` con expiración automática de 30 minutos
- **Estructura**:
  ```json
  {
    "cacheKey": "cache_historial_page=1&limit=10",
    "data": { /* datos del historial */ },
    "ttl": 1234567890
  }
  ```

### Flujo de Funcionamiento

#### 1. Endpoint `/historial`

**Primera consulta:**
1. Se valida el token JWT en el Authorizer
2. Se verifica si existe caché para los parámetros de consulta
3. Si no hay caché, se consulta la tabla `datosFusionados`
4. Se guarda el resultado en caché con TTL de 30 minutos
5. Se devuelve la respuesta con header `X-Cache: MISS`

**Consultas posteriores (dentro de 30 minutos):**
1. Se valida el token JWT en el Authorizer
2. Se encuentra el dato en caché
3. Se devuelve la respuesta directamente desde caché con header `X-Cache: HIT`
4. **No se ejecuta la Lambda de Historial**

#### 2. Endpoint `/fusionados`

1. Se procesa la fusión de datos normalmente
2. Se guarda/actualiza en la tabla `datosFusionados`
3. **Se limpia completamente el caché** para asegurar datos actualizados
4. Se devuelve la respuesta

#### 3. Authorizer

El Authorizer ahora incluye lógica para:
- Detectar cuando se accede al endpoint `/historial`
- Verificar la disponibilidad de caché
- Loggear información sobre el estado del caché

## Archivos Modificados

### 1. `app.yml`
- Agregada tabla `cacheTable` con TTL habilitado
- Agregadas variables de entorno `CACHE_TABLE_NAME`
- Agregadas políticas de acceso a la tabla de caché

### 2. `src/Lambdas/Historial/`
- `index.ts`: Implementada lógica de caché
- `cache-utils.ts`: Utilidades para manejo de caché
- `types.ts`: Tipos adicionales para caché
- `tsconfig.json`: Configuración actualizada

### 3. `src/Lambdas/Fusionados/`
- `index.ts`: Agregada limpieza de caché
- `cache-utils.ts`: Utilidades para manejo de caché

### 4. `src/Lambdas/Authorizer/`
- `index.ts`: Agregada verificación de caché
- `package.json`: Dependencias de AWS SDK agregadas

## Funciones de Caché

### `getFromCache(cacheKey: string)`
Obtiene datos del caché verificando que no hayan expirado.

### `saveToCache(cacheKey: string, data: any)`
Guarda datos en caché con TTL de 30 minutos.

### `deleteFromCache(cacheKey: string)`
Elimina un elemento específico del caché.

### `clearAllCache()`
Limpia todo el caché (usado cuando se modifican datos).

### `generateCacheKey(endpoint: string, params?: Record<string, any>)`
Genera claves únicas basadas en el endpoint y parámetros.

## Beneficios

1. **Rendimiento**: Respuestas más rápidas para consultas repetidas
2. **Costo**: Menos ejecuciones de Lambda para consultas frecuentes
3. **Escalabilidad**: El caché se escala automáticamente con DynamoDB
4. **Consistencia**: Invalidación automática cuando los datos cambian
5. **TTL**: Limpieza automática de datos expirados

## Headers de Respuesta

- `X-Cache: HIT` - Datos obtenidos desde caché
- `X-Cache: MISS` - Datos obtenidos desde DynamoDB
- `X-Cache: N/A` - Respuestas de error

## Consideraciones

1. **TTL**: Los datos expiran automáticamente después de 30 minutos
2. **Invalidación**: El caché se limpia completamente cuando se usan `/fusionados`
3. **Parámetros**: El caché es específico para cada combinación de parámetros
4. **Fallback**: Si el caché falla, se usa la consulta normal a DynamoDB 