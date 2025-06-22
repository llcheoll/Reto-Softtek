# Función Lambda - Almacenar Personajes

Esta función Lambda permite crear y actualizar personajes en la tabla DynamoDB `personajes`.

## Funcionalidades

- ✅ Validación completa de datos de entrada
- ✅ Creación de nuevos personajes con UUID v4
- ✅ Actualización de personajes existentes (por nombre)
- ✅ Tipado fuerte con TypeScript
- ✅ Manejo de errores robusto
- ✅ Respuestas estandarizadas

## Estructura de Datos

### Entrada (POST /almacenar)

```json
{
  "nombre": "string (máx 50 caracteres, obligatorio)",
  "edad": "number (> 0, obligatorio)",
  "atributo": "string (máx 50 caracteres, obligatorio)"
}
```

### Salida

#### Éxito (200)
```json
{
  "success": true,
  "message": "Personaje creado/actualizado exitosamente",
  "data": {
    "id": "uuid-v4",
    "nombre": "string",
    "edad": "number",
    "atributo": "string",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

#### Error de Validación (400)
```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "error": "VALIDATION_ERROR",
  "details": ["Lista de errores específicos"]
}
```

#### Error Interno (500)
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "INTERNAL_SERVER_ERROR"
}
```

## Validaciones

### Nombre
- ✅ Obligatorio
- ✅ Tipo string
- ✅ Máximo 50 caracteres
- ✅ No puede estar vacío después de trim()

### Edad
- ✅ Obligatorio
- ✅ Tipo number
- ✅ Debe ser mayor a 0

### Atributo
- ✅ Obligatorio
- ✅ Tipo string
- ✅ Máximo 50 caracteres
- ✅ No puede estar vacío después de trim()

## Lógica de Negocio

1. **Verificación de existencia**: Se busca un personaje existente por nombre
2. **Creación**: Si no existe, se crea uno nuevo con UUID v4
3. **Actualización**: Si existe, se actualiza manteniendo el ID y fecha de creación original
4. **Timestamps**: Se actualiza automáticamente `updatedAt` en ambos casos

## Variables de Entorno

- `PERSONAJES_TABLE_NAME`: Nombre de la tabla DynamoDB

## Dependencias

- `@aws-sdk/client-dynamodb`: Cliente DynamoDB
- `@aws-sdk/lib-dynamodb`: Document client para DynamoDB
- `uuid`: Generación de UUIDs v4
- `@types/aws-lambda`: Tipos para AWS Lambda
- `@types/node`: Tipos para Node.js
- `@types/uuid`: Tipos para UUID
- `esbuild`: Compilador para TypeScript (requerido por SAM CLI)

## Scripts Disponibles

```bash
npm run type-check  # Verificar tipos TypeScript
npm run build       # Compilar el proyecto
npm run clean       # Limpiar archivos generados
```

## Troubleshooting

### Error: "Cannot find esbuild"
Si encuentras el error `Esbuild Failed: Cannot find esbuild`, asegúrate de:

1. Tener esbuild instalado como dependencia de desarrollo:
   ```bash
   npm install --save-dev esbuild
   ```

2. Verificar que todas las dependencias estén instaladas:
   ```bash
   npm install
   ```

3. Si el problema persiste, intenta limpiar e instalar de nuevo:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Ejemplo de Uso

### Crear nuevo personaje
```bash
curl -X POST https://api-gateway-url/almacenar \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Gandalf",
    "edad": 2019,
    "atributo": "Magia"
  }'
```

### Actualizar personaje existente
```bash
curl -X POST https://api-gateway-url/almacenar \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Gandalf",
    "edad": 2020,
    "atributo": "Magia Blanca"
  }'
``` 