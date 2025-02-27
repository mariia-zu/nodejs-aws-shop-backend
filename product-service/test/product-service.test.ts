import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ProductServiceStack } from '../lib/product-service-stack';

describe('ProductServiceStack', () => {
  const app = new App();
  const stack = new ProductServiceStack(app, 'TestProductServiceStack');
  const template = Template.fromStack(stack);

  test('should create two Lambda functions', () => {
    template.resourceCountIs('AWS::Lambda::Function', 2);
  });

  test('should create API Gateway REST API', () => {
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  });

  test('should create API Gateway resources', () => {
    template.resourceCountIs('AWS::ApiGateway::Resource', 2); 
  });

  test('should create API Gateway methods', () => {
    template.resourceCountIs('AWS::ApiGateway::Method', 2);
  });
});