import { handler } from "../lambda/importProductsFile";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mockClient } from "aws-sdk-client-mock";

jest.mock("@aws-sdk/s3-request-presigner");

describe("importProductsFile Lambda", () => {
  const s3Mock = mockClient(S3Client);
  const mockSignedUrl = "https://mock-signed-url.com";

  beforeEach(() => {
    s3Mock.reset();
    (getSignedUrl as jest.Mock).mockReset();
    (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);
    process.env.BUCKET_NAME = "XXXXXXXXXXX";
  });

  it("should return signed URL when filename is provided", async () => {
    const event = {
      queryStringParameters: {
        name: "test.csv",
      },
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ signedUrl: mockSignedUrl });
    expect(response.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET",
      "Content-Type": "application/json",
    });

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(PutObjectCommand),
      expect.objectContaining({
        expiresIn: 3600
      })
    );

    const putObjectCommandCalls = (getSignedUrl as jest.Mock).mock.calls[0];
    const putObjectCommandParams = putObjectCommandCalls[1].input;
    
    expect(putObjectCommandParams).toEqual({
      Bucket: 'XXXXXXXXXXX',
      Key: 'uploaded/test.csv',
      ContentType: 'text/csv'
    });
  });

  it("should return 400 when filename is not provided", async () => {
    const event = {
      queryStringParameters: null,
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "File name is required",
    });
    expect(response.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET",
      "Content-Type": "application/json",
    });
  });

  it("should return 500 when S3 operations fail", async () => {
    (getSignedUrl as jest.Mock).mockRejectedValue(new Error("S3 Error"));

    const event = {
      queryStringParameters: {
        name: "test.csv",
      },
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "Internal server error",
    });
    expect(response.headers).toEqual({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET",
      "Content-Type": "application/json",
    });
  });

  it("should handle empty queryStringParameters", async () => {
    const event = {
      queryStringParameters: {},
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "File name is required",
    });
  });

  it("should handle missing queryStringParameters", async () => {
    const event = {};

    const response = await handler(event as any);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "File name is required",
    });
  });
});
