import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Runtime, Function, Code } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";

export class ImportServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucketArn = "arn:aws:s3:::shop-app-uploaded";
    const s3Bucket = Bucket.fromBucketArn(this, "ImportBucket", bucketArn);

    const importProductsFile = new Function(
      this,
      "ImportProductsFileFunction",
      {
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromAsset("lambda"),
        handler: "importProductsFile.handler",
        memorySize: 128,
        timeout: Duration.seconds(5),
        environment: {
          BUCKET_NAME: s3Bucket.bucketName,
        },
      }
    );

    const importFileParser = new Function(this, "ImportFileParserFunction", {
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("lambda"),
      handler: "importFileParser.handler",
      memorySize: 128,
      timeout: Duration.seconds(30),
      environment: {
        BUCKET_NAME: s3Bucket.bucketName,
      },
    });

    s3Bucket.grantRead(importProductsFile);
    s3Bucket.grantReadWrite(importFileParser);

    s3Bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParser),
      { prefix: "uploaded/" }
    );

    const api = new RestApi(this, "Import Service", {
      restApiName: "Shop Import Service",
      description: "This is the Import Service API",
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowMethods: ["GET", "PUT", "POST"],
        allowHeaders: ["*"],
        exposeHeaders: [],
        maxAge: Duration.days(1),
      },
    });

    const importAPI = api.root.addResource("import");
    importAPI.addMethod("GET", new LambdaIntegration(importProductsFile));
  }
}
