import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
  TransactWriteCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { SQSEvent } from "aws-lambda";
import { randomUUID } from "crypto";

const snsClient = new SNSClient({});
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const productsTableName = process.env.PRODUCTS_TABLE_NAME;
const stocksTableName = process.env.STOCKS_TABLE_NAME;

export const handler = async (event: SQSEvent): Promise<any> => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));
    const products: any[] = [];

    const promises = event.Records.map((body) => {
      const id = randomUUID();
      const { title, description, price, count } = JSON.parse(body.body);
      products.push({
        id, title, description, price, count
      });

      const transactItems: NonNullable<
        TransactWriteCommandInput["TransactItems"]
      > = [
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
      return docClient.send(command);
    });

    await Promise.all(promises);
    await sendSNSNotification(products);

  } catch (error) {
    console.error(`Error processing event: ${error}`);
  }
};


async function sendSNSNotification(products: any[]) {
  for (const product of products) {
    const command = new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Subject: 'Products Created Successfully',
      Message: JSON.stringify({
        message: `Product ${product.title} created`,
        product: product,
        price: Number(product.price),
      }),
      MessageAttributes: {
        price: {
          DataType: 'Number',
          StringValue: product.price.toString()
        }
      }
    });

    await snsClient.send(command);
  }
};