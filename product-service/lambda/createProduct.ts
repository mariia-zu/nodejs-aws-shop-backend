import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommandInput, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';


const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayEvent) => {
  const productsTableName = process.env.PRODUCTS_TABLE_NAME;
  const stocksTableName = process.env.STOCKS_TABLE_NAME;
  try {
    const product = event.body ? JSON.parse(event.body) : undefined;
    if (!event.body || !product || !product.title || !product.price) {
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
    
    const id = randomUUID();
    const { title, description, price, count } = product;

    console.log(`Creating new product with id ${id}, title ${title}, description ${description}, price ${price}, count ${count}`)

    const transactItems: NonNullable<TransactWriteCommandInput["TransactItems"]> = [
      {
        Put: {
          TableName: productsTableName,
          Item: {
            id,
            title,
            description,
            price,
          },
        },
      },
      {
        Put: {
          TableName: stocksTableName,
          Item: {
            product_id: id,
            count,
          },
        },
      },
    ];

    const command = new TransactWriteCommand({
      TransactItems: transactItems,
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

