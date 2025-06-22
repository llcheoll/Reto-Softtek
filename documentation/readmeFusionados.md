# Lambda Fusionados

Esta lambda se encarga de fusionar datos de personajes con rangos de edad y almacenar el resultado en la tabla `datosFusionados`.

## Funcionalidad

1. **Recibe un parámetro `nombre`** por query string en una petición GET
2. **Busca el personaje** en la tabla `personajes` por nombre
3. **Obtiene todos los rangos de edad** de la tabla `rangosEdad`
4. **Determina el rango de edad** correspondiente basado en la edad del personaje
5. **Crea un registro fusionado** con los datos del personaje y su rango de edad
6. **Almacena el resultado** en la tabla `datosFusionados`

## Endpoint

```
GET /fusionados?nombre={nombre_del_personaje}
```

## Ejemplo de uso

```bash
curl -X GET "https://your-api-gateway-url/fusionados?nombre=Ana"
```

## Respuesta exitosa

```json
{
  "success": true,
  "message": "Datos fusionados creados exitosamente",
  "data": {
    "id": "uuid-generado",
    "nombre": "Ana",
    "edad": 25,
    "atributo": "Fuerza",
    "nombre_rango": "Adulto"
  }
}
```

## Respuesta de error (personaje no encontrado)

```json
{
  "success": false,
  "message": "No existe un personaje con el nombre \"Ana\"",
  "error": "PERSONAJE_NOT_FOUND"
}
```

## Rangos de edad configurados

- **Bebé**: 0-1 años
- **Niño/a**: 2-12 años
- **Adolescente**: 13-17 años
- **Adulto**: 18-64 años
- **Anciano**: 65-999 años

## Configuración de tablas

### Tabla personajes
- Clave primaria: `nombre` (String)
- Índice secundario: `id` (String)

### Tabla rangosEdad
- Clave primaria: `id` (String)

### Tabla datosFusionados
- Clave primaria: `id` (String)
- Índice secundario: `nombre` (String)

## Variables de entorno requeridas

- `PERSONAJES_TABLE_NAME`: Nombre de la tabla de personajes
- `RANGOSEDAD_TABLE_NAME`: Nombre de la tabla de rangos de edad
- `DATOSFUSIONADOS_TABLE_NAME`: Nombre de la tabla de datos fusionados

## Despliegue

### 1. Instalar dependencias
```bash
cd src/Lambdas/Fusionados
npm install
```

### 2. Desplegar con SAM
```bash
# Desde el directorio raíz del proyecto
sam build
sam deploy
```

### 3. Poblar datos iniciales de rangos de edad
```bash
# Configurar variables de entorno
export RANGOSEDAD_TABLE_NAME="tu-tabla-rangos-edad"

# Ejecutar el script
node populate-rangos-edad.js
```

O puedes insertar manualmente los datos del archivo `rangos-edad-data.json` en tu tabla DynamoDB.

## Flujo de trabajo típico

1. **Crear un personaje** usando la lambda `Almacenar` (POST /almacenar)
2. **Poblar la tabla rangosEdad** con los datos iniciales
3. **Fusionar datos** usando esta lambda (GET /fusionados?nombre=NombrePersonaje)
4. **Verificar el resultado** en la tabla `datosFusionados`

## Casos de error manejados

- **PERSONAJE_NOT_FOUND**: El personaje especificado no existe
- **RANGOS_EDAD_NOT_FOUND**: No hay rangos de edad configurados
- **RANGO_EDAD_NOT_FOUND**: No se encontró un rango válido para la edad del personaje
- **VALIDATION_ERROR**: El parámetro nombre es inválido
- **METHOD_NOT_ALLOWED**: Se usa un método HTTP diferente a GET

## Solución de problemas

### Error 500 - Error interno del servidor

Si recibes un error 500, verifica:

1. **Que las tablas existan** y tengan los nombres correctos
2. **Que la tabla rangosEdad tenga datos** (usa el script de población)
3. **Que los permisos IAM** estén configurados correctamente
4. **Los logs de CloudWatch** para ver el error específico

### Verificar logs de CloudWatch

```bash
# Obtener el nombre del log group
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/ApiSofttek-Fusionados"

# Ver los logs más recientes
aws logs tail /aws/lambda/ApiSofttek-Fusionados-XXXXX --follow
```

### Verificar datos en DynamoDB

```bash
# Verificar que existan rangos de edad
aws dynamodb scan --table-name tu-tabla-rangos-edad

# Verificar que exista el personaje
aws dynamodb get-item --table-name tu-tabla-personajes --key '{"nombre": {"S": "yoda"}}'
```

## Testing local

Puedes probar la lambda localmente usando el archivo `test-example.json`:

```bash
sam local invoke Fusionados -e test-example.json
``` 