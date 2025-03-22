import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  APIGatewayTokenAuthorizerHandler,
} from "aws-lambda";

export const handler: APIGatewayTokenAuthorizerHandler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<any> => {
// ): Promise<APIGatewayAuthorizerResult> | any => {
  const token = event.authorizationToken;

  console.log(event);

  return new Promise(() => {});
};
