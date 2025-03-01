import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const productTableName = process.env.PRODUCTS_TABLE_NAME;
  const stocksTableName = process.env.PRODUCTS_TABLE_NAME;

  try {
    const productCommand = new ScanCommand({
      TableName: productTableName
    });
    const stockCommand = new ScanCommand({
      TableName: stocksTableName
    });
    const productsResult = await docClient.send(productCommand);
    const stocksResult = await docClient.send(stockCommand);
    const products = productsResult.Items ? productsResult.Items.map(item => unmarshall(item)) : [];
    const stocks = stocksResult.Items ? stocksResult.Items.map(item => unmarshall(item)) : [];

    const stocksMap = stocks.reduce((acc, stock) => {
      acc[stock.product_id] = stock.count;
      return acc;
    }, {});
    const allProducts = products.map(product => ({
      ...product,
      count: stocksMap[product.id] || 0
    }));


    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(allProducts),
    };
  } catch (error) {
    console.error(`Error processing event: ${error}`);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
