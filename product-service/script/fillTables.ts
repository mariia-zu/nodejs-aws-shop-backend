import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, TransactWriteCommand, TransactWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { PRODUCTS } from "./products";
import { config } from "dotenv";

config();
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

function fill() {
  const products = PRODUCTS;
  const productsTableName = process.env.PRODUCTS_TABLE_NAME;
  const stockTableName = process.env.STOCKS_TABLE_NAME;

  const transactItems = products.reduce((acc: NonNullable<TransactWriteCommandInput["TransactItems"]>, product) => {
    const { id, title, description, price } = product;

    return [
      ...acc,
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
          TableName: stockTableName,
          Item: {
            product_id: id,
            count: Math.floor(Math.random() * 100),
          },
        },
      },
    ];
  }, []);

  const command = new TransactWriteCommand({
    TransactItems: transactItems,
  });

  return docClient.send(command);
}

fill()
  .then(() => {
    console.log("Products added to the database");
  })
  .catch((error) => {
    console.error("Error: ", error);
  });
