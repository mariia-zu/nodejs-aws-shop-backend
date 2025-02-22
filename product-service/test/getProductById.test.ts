import { APIGatewayEvent } from 'aws-lambda';
import { handler } from '../lambda/getProductsById';
import { PRODUCTS } from '../lambda/products';

describe('Lambda function handler', () => {
  test('should successfully find the product', async () => {
    const event = {
      pathParameters: {
        id: PRODUCTS[0].id,
      },
    };
    
    const response = await handler(event as unknown as APIGatewayEvent);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(PRODUCTS[0]);
  });

  test('should return a 404 when product is not found', async () => {
    const event = {
      pathParameters: {
        id: 'non-existent-id',
      }
    };
    
    const response = await handler(event as unknown as APIGatewayEvent);
    
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({ message: 'Product not found' });
  });
});