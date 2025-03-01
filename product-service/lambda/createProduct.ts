import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayEvent) => {
  try {
    const product = event.body ? JSON.parse(event.body) : undefined;
    if (!event.body || !product || !product.id || !product.title || !product.price) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: "Missing request body or required fields (id, title, price)" }),
      };
    }

    const command = new PutCommand({
      TableName: process.env.PRODUCTS_TABLE_NAME,
      Item: {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
      },
    });
  
    const response = await docClient.send(command);
    console.log(response);
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Product created successfully",
        product: product,
      }),
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

