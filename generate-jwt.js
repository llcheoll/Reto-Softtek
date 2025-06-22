#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuración
const JWT_SECRET = 'test-secret-123-retotecnico-xyz'; // Debe coincidir con el secreto en app.yml
const DEFAULT_EXPIRY = '24h'; // 24 horas por defecto

/**
 * Genera un token JWT de prueba
 * @param {Object} payload - Datos a incluir en el token
 * @param {string} expiresIn - Tiempo de expiración (ej: '1h', '7d', '30d')
 * @returns {string} Token JWT generado
 */
function generateJWT(payload = {}, expiresIn = DEFAULT_EXPIRY) {
    const defaultPayload = {
        userId: crypto.randomBytes(8).toString('hex'),
        iat: Math.floor(Date.now() / 1000),
        ...payload
    };

    try {
        const token = jwt.sign(defaultPayload, JWT_SECRET, { 
            expiresIn,
            algorithm: 'HS256'
        });
        return token;
    } catch (error) {
        console.error('Error generando JWT:', error.message);
        return null;
    }
}

/**
 * Verifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object|null} Payload decodificado o null si es inválido
 */
function verifyJWT(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Error verificando JWT:', error.message);
        return null;
    }
}

/**
 * Decodifica un token JWT sin verificar la firma
 * @param {string} token - Token JWT a decodificar
 * @returns {Object|null} Payload decodificado
 */
function decodeJWT(token) {
    try {
        const decoded = jwt.decode(token);
        return decoded;
    } catch (error) {
        console.error('Error decodificando JWT:', error.message);
        return null;
    }
}

/**
 * Muestra información del token
 * @param {string} token - Token JWT
 */
function showTokenInfo(token) {
    console.log('\n🔍 Información del Token:');
    console.log('='.repeat(50));
    
    const decoded = decodeJWT(token);
    if (!decoded) {
        console.log('❌ Token inválido');
        return;
    }

    console.log('📋 Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Verificar si el token es válido
    const verified = verifyJWT(token);
    if (verified) {
        console.log('\n✅ Token válido');
        
        // Calcular tiempo restante
        if (decoded.exp) {
            const now = Math.floor(Date.now() / 1000);
            const remaining = decoded.exp - now;
            const hours = Math.floor(remaining / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            
            console.log(`⏰ Expira en: ${hours}h ${minutes}m`);
        }
    } else {
        console.log('\n❌ Token expirado o inválido');
    }
}

/**
 * Función principal del script
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    console.log('🔐 Generador de Tokens JWT - API de Personajes');
    console.log('='.repeat(50));

    switch (command) {
        case 'generate':
        case 'gen':
        case undefined:
            // Generar token por defecto
            const token = generateJWT();
            console.log('\n🎉 Token JWT generado:');
            console.log('='.repeat(50));
            console.log(token);
            showTokenInfo(token);
            break;

        case 'custom':
            // Generar token personalizado
            const customPayload = {};
            let expiresIn = DEFAULT_EXPIRY;

            // Parsear argumentos adicionales
            for (let i = 1; i < args.length; i++) {
                const arg = args[i];
                if (arg.startsWith('--expires=')) {
                    expiresIn = arg.split('=')[1];
                } else if (arg.startsWith('--user=')) {
                    customPayload.userId = arg.split('=')[1];
                } else if (arg.startsWith('--role=')) {
                    customPayload.role = arg.split('=')[1];
                } else if (arg.startsWith('--name=')) {
                    customPayload.name = arg.split('=')[1];
                }
            }

            const customToken = generateJWT(customPayload, expiresIn);
            console.log('\n🎉 Token JWT personalizado generado:');
            console.log('='.repeat(50));
            console.log(customToken);
            showTokenInfo(customToken);
            break;

        case 'verify':
        case 'check':
            // Verificar token existente
            const tokenToVerify = args[1];
            if (!tokenToVerify) {
                console.log('❌ Error: Debes proporcionar un token para verificar');
                console.log('Uso: node generate-jwt.js verify <token>');
                process.exit(1);
            }

            showTokenInfo(tokenToVerify);
            break;

        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;

        default:
            console.log(`❌ Comando desconocido: ${command}`);
            showHelp();
            process.exit(1);
    }
}

/**
 * Muestra la ayuda del script
 */
function showHelp() {
    console.log(`
📖 Uso del Generador de Tokens JWT:

🔹 Generar token por defecto:
   node generate-jwt.js
   node generate-jwt.js generate

🔹 Generar token personalizado:
   node generate-jwt.js custom [opciones]
   
   Opciones disponibles:
   --expires=<tiempo>    Tiempo de expiración (ej: 1h, 7d, 30d)
   --user=<id>          ID de usuario personalizado
   --role=<rol>         Rol del usuario
   --name=<nombre>      Nombre del usuario

🔹 Verificar token existente:
   node generate-jwt.js verify <token>
   node generate-jwt.js check <token>

🔹 Mostrar ayuda:
   node generate-jwt.js help

📝 Ejemplos:

   # Token por defecto (24h)
   node generate-jwt.js

   # Token que expira en 1 hora
   node generate-jwt.js custom --expires=1h

   # Token personalizado con usuario y rol
   node generate-jwt.js custom --user=admin123 --role=admin --expires=7d

   # Verificar token
   node generate-jwt.js verify eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🔧 Configuración:
   - Secreto JWT: ${JWT_SECRET}
   - Expiración por defecto: ${DEFAULT_EXPIRY}
   - Algoritmo: HS256

💡 Tip: Copia el token generado y úsalo en el header Authorization:
   Authorization: Bearer <token>
`);
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
    main();
}

// Exportar funciones para uso en otros módulos
module.exports = {
    generateJWT,
    verifyJWT,
    decodeJWT,
    showTokenInfo
}; 