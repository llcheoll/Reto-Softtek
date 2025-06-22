const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// Datos de rangos de edad
const rangosEdadData = {
  "rangosEdad": [
    {
      "id": "ajsdnkasd323",
      "nombre_rango": "Bebé",
      "edad_minima": 0,
      "edad_maxima": 1
    },
    {
      "id": "kamdasd",
      "nombre_rango": "Niño/a",
      "edad_minima": 2,
      "edad_maxima": 12
    },
    {
      "id": "lmas8du193en",
      "nombre_rango": "Adolescente",
      "edad_minima": 13,
      "edad_maxima": 17
    },
    {
      "id": "mkamskdm92",
      "nombre_rango": "Adulto",
      "edad_minima": 18,
      "edad_maxima": 64
    },
    {
      "id": "ñlaskdasd55238",
      "nombre_rango": "Anciano",
      "edad_minima": 65,
      "edad_maxima": 999
    }
  ]
};

// Cliente de DynamoDB
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function poblarRangosEdad() {
  console.log('Iniciando población de rangos de edad...');
  
  try {
    const tableName = process.env.RANGOSEDAD_TABLE_NAME;
    if (!tableName) {
      throw new Error('RANGOSEDAD_TABLE_NAME no está definido en las variables de entorno');
    }

    console.log(`Tabla objetivo: ${tableName}`);
    console.log(`Rangos a insertar: ${rangosEdadData.rangosEdad.length}`);

    for (const rango of rangosEdadData.rangosEdad) {
      console.log(`Insertando rango: ${rango.nombre_rango} (${rango.edad_minima}-${rango.edad_maxima})`);
      
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: rango
      }));
      
      console.log(`✅ Rango ${rango.nombre_rango} insertado exitosamente`);
    }

    console.log('🎉 Todos los rangos de edad han sido insertados exitosamente');
  } catch (error) {
    console.error('❌ Error al poblar rangos de edad:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  poblarRangosEdad()
    .then(() => {
      console.log('Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script falló:', error);
      process.exit(1);
    });
}

module.exports = { poblarRangosEdad };