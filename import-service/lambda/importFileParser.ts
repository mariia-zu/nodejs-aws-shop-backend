import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { Readable } from "stream";
import csvParser from 'csv-parser';
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const s3Client = new S3Client();
const sqsClient = new SQSClient();
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

export const handler = async (event: S3Event) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const filePath = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, " ")
      );

      console.log(`Processing file ${filePath} from bucket ${bucket}`);

      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: filePath,
        })
      );

      if (Body instanceof Readable) {
        await new Promise((res, rej) => {
          Body.pipe(csvParser())
            .on("data", async (data) => {
              try {
                Body.pause();
                await sendToSQS(data);
                Body.resume();
              } catch (error) {
                console.error("Processing error", error);
              }
            })
            .on("error", (error) => {
              console.error("Error parsing CSV:", error);
              rej(error);
            })
            .on("end", async () => {
              console.log("Finished processing CSV file");

              try {
                const destinationPath = filePath.replace("uploaded", "parsed");

                await s3Client.send(
                  new CopyObjectCommand({
                    Bucket: bucket,
                    CopySource: `${bucket}/${filePath}`,
                    Key: destinationPath,
                  })
                );

                await s3Client.send(
                  new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: filePath,
                  })
                );

                console.log(
                  `Successfully moved file from ${filePath} to ${destinationPath}`
                );
                res(null);
              } catch (moveError) {
                console.error("Error moving file:", moveError);
                rej(moveError);
              }
            });
        });
      }
    }
    return {
      statusCode: 200,
      body: "Successfully processed S3 event",
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

async function sendToSQS(record: any): Promise<void> {
  try {
    const command = new SendMessageCommand({
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        title: record.title,
        description: record.description,
        price: Number(record.price),
        count: Number(record.count),
      }),
    });

    console.log("SQS_QUEUE_URL=", SQS_QUEUE_URL);

    await sqsClient.send(command);
    console.log("Successfully sent message to SQS:", record.title);
  } catch (error) {
    console.error("Error sending message to SQS:", error);
    throw error;
  }
}