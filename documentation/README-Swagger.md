# Documentación Swagger - API de Personajes

## 📋 Descripción

Esta documentación Swagger te permite probar los 3 endpoints principales de la API de Personajes de forma interactiva:

1. **POST /almacenar** - Almacena un nuevo personaje
2. **GET /fusionados** - Obtiene datos fusionados de personajes
3. **GET /historial** - Obtiene el historial de fusiones

## 🚀 Cómo usar la documentación

### Opción 1: Abrir el archivo HTML localmente

1. Abre el archivo `swagger-ui.html` en tu navegador web
2. La documentación se cargará automáticamente desde el archivo `swagger.yml`

### Opción 2: Usar Swagger Editor online

1. Ve a [Swagger Editor](https://editor.swagger.io/)
2. Copia y pega el contenido del archivo `swagger.yml`
3. La documentación se renderizará automáticamente

### Opción 3: Usar herramientas de línea de comandos

```bash
# Instalar swagger-ui-server globalmente
npm install -g swagger-ui-server

# Servir la documentación localmente
swagger-ui-server swagger.yml
```

### Opción 4: Servidor local con npm

```bash
# Instalar dependencias
npm install

# Servir la documentación en http://localhost:8080
npm run serve-swagger
```

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT. El token debe incluirse en el header `Authorization`:

```
Authorization: Bearer <tu-token-jwt>
```

### Generador de Tokens JWT

Incluimos un script para generar tokens JWT de prueba:

#### Instalación de dependencias:
```bash
npm install
```

#### Uso del generador:

**Generar token por defecto (24h):**
```bash
npm start
# o
node generate-jwt.js
```

**Generar token personalizado:**
```bash
# Token que expira en 1 hora
node generate-jwt.js custom --expires=1h

# Token con usuario y rol personalizados
node generate-jwt.js custom --user=admin123 --role=admin --expires=7d

# Token con nombre de usuario
node generate-jwt.js custom --name="Juan Pérez" --expires=30d
```

**Verificar token existente:**
```bash
node generate-jwt.js verify <tu-token-jwt>
```

**Ver ayuda completa:**
```bash
node generate-jwt.js help
```

### Token de ejemplo incluido

La documentación incluye un token JWT de ejemplo que se aplica automáticamente:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## 📝 Endpoints disponibles

### 1. POST /almacenar

**Descripción:** Almacena un nuevo personaje en la base de datos.

**Validaciones:**
- Nombre: 2-50 caracteres
- Edad: 0-900 años
- Atributo: debe ser uno de: "fuerza", "destreza", "inteligencia", "carisma", "constitución"

**Ejemplo de request:**
```json
{
  "nombre": "Gandalf",
  "edad": 2019,
  "atributo": "inteligencia"
}
```

### 2. GET /fusionados

**Descripción:** Obtiene datos fusionados de personajes con información de rangos de edad.

**Parámetros opcionales:**
- `nombre`: Filtrar por nombre del personaje
- `limit`: Número máximo de resultados (default: 10, max: 100)

**Ejemplo de request:**
```
GET /fusionados?nombre=Gandalf&limit=20
```

### 3. GET /historial

**Descripción:** Obtiene el historial paginado de todas las fusiones realizadas.

**Parámetros opcionales:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)
- `nombre`: Filtrar por nombre del personaje

**Ejemplo de request:**
```
GET /historial?page=1&limit=20&nombre=Gandalf
```

## 🧪 Endpoint de prueba

### GET /test

**Descripción:** Endpoint de prueba para verificar que la autenticación JWT funciona correctamente.

**Uso:** Útil para probar tokens sin afectar datos reales.

## 🔧 Configuración del servidor

### Para desarrollo local

Si estás ejecutando la API localmente, actualiza la URL del servidor en `swagger.yml`:

```yaml
servers:
  - url: http://localhost:3000
    description: Servidor local (para desarrollo)
```

### Para producción

Actualiza la URL con tu API Gateway real:

```yaml
servers:
  - url: https://{api-id}.execute-api.{region}.amazonaws.com/Prod
    description: Servidor de producción
    variables:
      api-id:
        description: ID del API Gateway
        default: "tu-api-id-real"
      region:
        description: Región de AWS
        default: "us-east-1"
```

## 📊 Respuestas de ejemplo

### Respuesta exitosa (200)
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    // Datos específicos del endpoint
  }
}
```

### Respuesta de error (400/401/500)
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "CODIGO_ERROR",
  "details": [
    "Detalle adicional 1",
    "Detalle adicional 2"
  ]
}
```

## 🛠️ Personalización

### Modificar el token JWT por defecto

En el archivo `swagger-ui.html`, busca esta línea y reemplaza el token:

```javascript
request.headers.Authorization = 'Bearer TU_NUEVO_TOKEN_AQUI';
```

### Generar nuevos tokens programáticamente

Puedes usar el script como módulo en otros archivos:

```javascript
const { generateJWT, verifyJWT } = require('./generate-jwt.js');

// Generar token
const token = generateJWT({ userId: 'mi-usuario' }, '1h');

// Verificar token
const payload = verifyJWT(token);
```

### Agregar nuevos endpoints

1. Edita el archivo `swagger.yml`
2. Agrega la nueva ruta en la sección `paths`
3. Define los schemas correspondientes en `components.schemas`
4. Actualiza la documentación HTML si es necesario

## 📚 Recursos adicionales

- [Especificación OpenAPI 3.0](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [JWT.io](https://jwt.io/) - Para generar y validar tokens JWT
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - Librería Node.js para JWT

## 🤝 Contribución

Para mejorar la documentación:

1. Actualiza el archivo `swagger.yml` con los cambios
2. Prueba los endpoints usando la interfaz Swagger
3. Actualiza este README si es necesario
4. Verifica que todos los ejemplos funcionen correctamente

## 📞 Soporte

Si tienes problemas con la documentación o los endpoints:

1. Verifica que el servidor esté ejecutándose
2. Confirma que el token JWT sea válido usando el script de verificación
3. Revisa los logs del servidor para errores
4. Consulta la documentación de AWS API Gateway si es necesario

## 🔧 Scripts disponibles

```bash
# Generar token JWT por defecto
npm start

# Generar token personalizado
npm run custom

# Verificar token
npm run verify

# Mostrar ayuda
npm run help

# Abrir documentación Swagger
npm run swagger

# Servir documentación localmente
npm run serve-swagger
``` 