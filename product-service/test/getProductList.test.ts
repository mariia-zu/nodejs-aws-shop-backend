import { handler } from '../lambda/getProductsList';
import { PRODUCTS } from '../lambda/products';

describe('Lambda function handler', () => {
  
  test('should return a successful response with products', async () => {
    const response = await handler({});
    
    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(response.body)).toEqual(PRODUCTS);
  });

});