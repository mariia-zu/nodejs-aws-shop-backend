import { handler } from "../lambda/importFileParser";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

jest.mock("@aws-sdk/client-s3");

describe("importFileParser", () => {
  const consoleSpy = {
    log: jest.spyOn(console, "log").mockImplementation(),
    error: jest.spyOn(console, "error").mockImplementation(),
  };

  const mockS3Event = {
    Records: [
      {
        s3: {
          bucket: {
            name: "test-bucket",
          },
          object: {
            key: "uploaded/test-file.csv",
          },
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully process a CSV file", async () => {
    const mockCsvData = "id,name\n1,test";
    const mockReadable = Readable.from([mockCsvData]);

    (S3Client as jest.MockedClass<typeof S3Client>).prototype.send
      .mockImplementationOnce(() => ({ Body: mockReadable }))
      .mockImplementationOnce(() => ({}))
      .mockImplementationOnce(() => ({}));

    const response = await handler(mockS3Event as any);

    expect(response).toEqual({
      statusCode: 200,
      body: "Successfully processed S3 event",
    });

    expect(S3Client.prototype.send).toHaveBeenCalledTimes(3);

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: mockS3Event.Records[0].s3.bucket.name,
      Key: "uploaded/test-file.csv",
    });

    expect(CopyObjectCommand).toHaveBeenCalledWith({
      Bucket: mockS3Event.Records[0].s3.bucket.name,
      CopySource: "test-bucket/uploaded/test-file.csv",
      Key: "parsed/test-file.csv",
    });

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: mockS3Event.Records[0].s3.bucket.name,
      Key: "uploaded/test-file.csv",
    });

    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Processing file")
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringContaining("Finished processing CSV file")
    );
  });
});
