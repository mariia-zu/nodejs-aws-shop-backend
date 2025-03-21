import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Runtime, Function, Code } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { FilterOrPolicy, SubscriptionFilter, Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { config } from "dotenv";

config();

const subscriptionEmail = "mariia.username@gmail.com";
const filteredEmail = "mariia.user.name@gmail.com";

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = Table.fromTableName(
      this,
      "ProductsTable",
      process.env.PRODUCTS_TABLE_NAME!
    );

    const stocksTable = Table.fromTableName(
      this,
      "StocksTable",
      process.env.STOCKS_TABLE_NAME!
    );

    const catalogItemsQueue = new Queue(this, "CatalogItemsQueue", {
      queueName: "catalogItemsQueue",
      visibilityTimeout: Duration.seconds(30),
      retentionPeriod: Duration.days(1),
      deliveryDelay: Duration.seconds(2),
    });

    const createProductTopic = new Topic(this, "CreateProductsTopic");

    createProductTopic.addSubscription(
      new EmailSubscription(subscriptionEmail)
    );

    createProductTopic.addSubscription(
      new EmailSubscription(filteredEmail, {
        filterPolicyWithMessageBody: {
          price: FilterOrPolicy.filter(
            SubscriptionFilter.numericFilter({
              greaterThan: 50,
            })
          ),
        },
        json: true,
      })
    );

    const environment = {
      PRODUCTS_TABLE_NAME: productsTable.tableName,
      STOCKS_TABLE_NAME: stocksTable.tableName,
    };

    const catalogBatchProcess = new Function(
      this,
      "CatalogBatchProcessFunction",
      {
        runtime: Runtime.NODEJS_22_X,
        code: Code.fromAsset("lambda"),
        handler: "catalogBatchProcess.handler",
        memorySize: 128,
        timeout: Duration.seconds(5),
        environment: {
          ...environment,
          SNS_TOPIC_ARN: createProductTopic.topicArn,
        },
      }
    );

    catalogBatchProcess.addEventSource(
      new SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);
    createProductTopic.grantPublish(catalogBatchProcess);

    const getProductsList = new Function(this, "GetProductsListFunction", {
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda"),
      handler: "getProductsList.handler",
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment,
    });

    const getProductByID = new Function(this, "GetProductByID", {
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda"),
      handler: "getProductsById.handler",
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment,
    });

    const createProduct = new Function(this, "CreateProduct", {
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda"),
      handler: "createProduct.handler",
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment,
    });

    productsTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductByID);
    productsTable.grantWriteData(createProduct);
    productsTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductByID);
    stocksTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(catalogBatchProcess);

    const api = new RestApi(this, "Product Service", {
      restApiName: "Shop Product Service",
      description: "This is the Product Service API",
    });

    const products = api.root.addResource("products");
    products.addMethod("GET", new LambdaIntegration(getProductsList));
    products
      .addResource("{id}")
      .addMethod("GET", new LambdaIntegration(getProductByID));
    products.addMethod("POST", new LambdaIntegration(createProduct));
  }
}
