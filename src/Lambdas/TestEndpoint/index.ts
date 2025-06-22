import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
  console.log('Test endpoint called:', JSON.stringify(event, undefined, 2));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      message: 'Test endpoint funcionando correctamente',
      method: event.httpMethod,
      path: event.path,
      timestamp: new Date().toISOString()
    })
  };
}; 