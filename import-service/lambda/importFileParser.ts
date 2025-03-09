import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { Readable } from "stream";
import * as csv from "csv-parser";

const s3Client = new S3Client();

export const handler = async (event: S3Event) => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

      console.log(`Processing file ${key} from bucket ${bucket}`);

      const { Body } = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      if (Body instanceof Readable) {
        await new Promise((res, rej) => {
          Body.pipe(csv())
            .on("data", (data) => {
              console.log("Parsed csv record:", JSON.stringify(data));
            })
            .on("error", (error) => {
              console.error("Error parsing CSV:", error);
              rej(error);
            })
            .on("end", () => {
              console.log("Finished processing CSV file");
              res(null);
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
