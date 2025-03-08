import { PutObjectCommand } from '@aws-sdk/client-s3';

export const handler = async (event: any) => {
  try {
    const filename = event.pathParameters?.filename;

    if (!filename) {
      const errorMessage = 'Missing file name';
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
      }
    }

    // const client = new S3Client({ region });
    // const command = new PutObjectCommand({
    //   Bucket: process.env.BUCKET_NAME,
    //   ContentType: "text/csv",
    //   Key: `${filename}`
    // });
    //   return getSignedUrl(client, command, { expiresIn: 3600 });
    
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
}