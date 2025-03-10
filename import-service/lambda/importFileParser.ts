import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { Readable } from "stream";
import csvParser from 'csv-parser';

const s3Client = new S3Client();

export const handler = async (event: S3Event) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const filePath = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

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
            .on("data", (data) => {
              console.log("Parsed csv record:", JSON.stringify(data));
            })
            .on("error", (error) => {
              console.error("Error parsing CSV:", error);
              rej(error);
            })
            .on("end", async () => {
              console.log("Finished processing CSV file");

              try {
                const destinationPath = filePath.replace('uploaded', 'parsed');
                
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

                console.log(`Successfully moved file from ${filePath} to ${destinationPath}`);
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
