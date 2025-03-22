import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  APIGatewayTokenAuthorizerHandler,
} from "aws-lambda";

export const handler: APIGatewayTokenAuthorizerHandler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log("EVENT: ", event);
  if (event.type !== "TOKEN") {
    return generatePolicy("user", event.methodArn, "Deny");
  }

  const authorizationToken = event.authorizationToken;
  const encodedCred = authorizationToken.split(" ")[1];
  const encodedToken = Buffer.from(encodedCred, "base64");
  const [username, password] = encodedToken.toString("utf-8").split(":");
  console.log("username: ", username);
  console.log("password: ", password);

  const storedUserPassword = process.env[username];

  const effect =
    !storedUserPassword || storedUserPassword !== password ? "Deny" : "Allow";
  return generatePolicy(encodedCred, event.methodArn, effect);
};

const generatePolicy = (
  principalId: string,
  resource: string,
  effect: "Deny" | "Allow"
) => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
