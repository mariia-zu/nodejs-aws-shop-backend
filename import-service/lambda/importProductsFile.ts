import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayEvent } from "aws-lambda";

export const handler = async (event: APIGatewayEvent) => {
  try {
    const filename = event.queryStringParameters?.name;

    if (!filename) {
      const errorMessage = "File name is required";
      console.log(errorMessage);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: errorMessage }),
      };
    }

    const client = new S3Client();
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      ContentType: "text/csv",
      Key: `uploaded/${filename}`
    });
    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: 3600,
      signableHeaders: new Set(['content-type'])
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET",
        "Content-Type": "application/json",
      },
      body: signedUrl,
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
