import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Runtime, Function, Code } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create Lambda function
    const getProductsList = new Function(this, "GetProductsListFunction", {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("lambda"),
      handler: "getProductsList.handler",
      memorySize: 128,
      timeout: Duration.seconds(5),
    });

    const getProductByID = new Function(this, "GetProductByID", {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("lambda"),
      handler: "getProductsById.handler",
      memorySize: 128,
      timeout: Duration.seconds(5),
    });

    // Create API Gateway
    const api = new RestApi(this, "Product Service", {
      restApiName: "Shop Product Service",
      description: "This is the Product Service API",
    });

    // Create API Gateway resource and method
    const products = api.root.addResource("products");
    products.addMethod("GET", new LambdaIntegration(getProductsList));
    products
      .addResource("{id}")
      .addMethod("GET", new LambdaIntegration(getProductByID));
  }
}
