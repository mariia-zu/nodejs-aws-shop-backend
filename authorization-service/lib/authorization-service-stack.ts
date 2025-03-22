import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { CfnOutput, Duration } from "aws-cdk-lib";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const login = "mariia-zu";
    const password = "TEST_PASSWORD";

    const environment = {
      LOGIN: login,
      PASSWORD: password,
    };

    const basicAuthorizer = new Function(this, "basicAuthorizerFunction", {
      runtime: Runtime.NODEJS_22_X,
      code: Code.fromAsset("lambda"),
      handler: "basicAuthorizer.handler",
      memorySize: 128,
      timeout: Duration.seconds(5),
      environment,
    });

    basicAuthorizer.addPermission("ApiGatewayInvocation", {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
    });

    new CfnOutput(this, "BasicAuthorizerArn", {
      value: basicAuthorizer.functionArn,
      description: "Basic Authorization Function Arn",
      exportName: "BasicAuthorizerArn",
    });
  }
}
