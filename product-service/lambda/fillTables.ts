import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { PRODUCTS } from './products';

const client = new DynamoDBClient({ region: 'us-west-1' });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const products = PRODUCTS;
    const stockTableName = process.env.STOCK_TABLE_NAME || 'stocks';
    const productsTableName = process.env.PRODUCTS_TABLE_NAME || 'products';

    // Create batch operations for both tables
    const operations = products.map(async (product) => {
      const { id, title, description, price } = product;

      // Insert into products table
      const productCommand = new PutCommand({
        TableName: productsTableName,
        Item: {
          id,
          title,
          description,
          price
        }
      });

      // Insert into stock table
      const stockCommand = new PutCommand({
        TableName: stockTableName,
        Item: {
          product_id: id,
          count: Math.floor(Math.random() * 100)
        }
      });

      // Execute both operations
      return Promise.all([
        docClient.send(productCommand),
        docClient.send(stockCommand)
      ]);
    });

    // Wait for all operations to complete
    await Promise.all(operations);

    console.log("Products added to the database");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully populated tables with ${products.length} products`
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error populating tables',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}