import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { handler } from "../lambda/catalogBatchProcess";
import { mockClient } from "aws-sdk-client-mock";
import { SQSEvent } from 'aws-lambda';

const ddbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

process.env.SNS_TOPIC_ARN = "test-topic-arn";
process.env.PRODUCTS_TABLE_NAME = "test-products-table";
process.env.STOCKS_TABLE_NAME = "test-stocks-table";

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid')
}));

describe('catalogBatchProcess', () => {
  beforeEach(() => {
    ddbMock.reset();
    snsMock.reset();
  });

  it('should process SQS event and create products', async () => {
    ddbMock.on(TransactWriteCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const testEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Test Product",
            description: "Test Description",
            price: 100,
            count: 10
          })
        }
      ]
    };

    await handler(testEvent as SQSEvent);

    expect(ddbMock.calls()).toHaveLength(1);
  });

  it('should handle multiple records in SQS event', async () => {
    ddbMock.on(TransactWriteCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});

    const testEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Product 1",
            description: "Description 1",
            price: 100,
            count: 10
          })
        },
        {
          body: JSON.stringify({
            title: "Product 2",
            description: "Description 2",
            price: 200,
            count: 20
          })
        }
      ]
    };

    await handler(testEvent as SQSEvent);

    expect(ddbMock.calls()).toHaveLength(2);
    expect(snsMock.calls()).toHaveLength(2);
  });

  it('should handle errors gracefully', async () => {
    ddbMock.on(TransactWriteCommand).rejects(new Error('DynamoDB error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const testEvent = {
      Records: [
        {
          body: JSON.stringify({
            title: "Test Product",
            description: "Test Description",
            price: 100,
            count: 10
          })
        }
      ]
    };

    await handler(testEvent as SQSEvent);

    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Error processing event');

    consoleSpy.mockRestore();
  });
});
