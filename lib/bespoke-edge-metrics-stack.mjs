import { Alias, Runtime, FunctionUrlAuthType } from "aws-cdk-lib/aws-lambda";
import { Stack, Duration, CfnOutput } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  Distribution,
  Function,
  FunctionCode,
  FunctionRuntime,
  OriginProtocolPolicy,
  PriceClass,
  AllowedMethods,
  OriginRequestPolicy,
  CachePolicy,
  FunctionEventType,
} from "aws-cdk-lib/aws-cloudfront";

import {
  HttpOrigin,
  FunctionUrlOrigin,
} from "aws-cdk-lib/aws-cloudfront-origins";

export class BespokeEdgeMetricsStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const func = new NodejsFunction(this, "EdgeMetricsFunction", {
      functionName: "EdgeMetricsFunction",
      runtime: Runtime.NODEJS_LATEST,
      entry: "src/handler.js",
      handler: "handler",
      timeout: Duration.seconds(3),
      bundling: {
        externalModules: ["@aws-sdk"],
      },
    });

    // add an alias to the lambda function
    const alias = new Alias(this, "FunctionAlias", {
      aliasName: "live",
      version: func.currentVersion,
    });

    // Note I haven't added auth here, in production you should either use IAM auth with a CloudFront OAC or
    // a secret header you validate in your lambda function to require all requests originate from CloudFront
    let url = alias.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    function createCFFunction(scope, id) {
      return new Function(scope, `${id}Fn`, {
        code: FunctionCode.fromFile({
          filePath: `cloudfront-functions/${id}.js`,
        }),
        runtime: FunctionRuntime.JS_2_0,
        functionName: id,
      });
    }

    const metricsAspect = createCFFunction(this, "metricsAspect");
    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new HttpOrigin("www.google.com", {
          protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
        }),
      },
      comment: "Metrics Aspect Distribution",
      priceClass: PriceClass.PRICE_CLASS_100,
      additionalBehaviors: {
        "/api/*": {
          allowedMethods: AllowedMethods.ALLOW_ALL,
          origin: new FunctionUrlOrigin(url, {}),
          originRequestPolicy:
            OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          functionAssociations: [
            {
              function: metricsAspect,
              eventType: FunctionEventType.VIEWER_REQUEST,
            },
            {
              function: metricsAspect,
              eventType: FunctionEventType.VIEWER_RESPONSE,
            },
          ],
        },
      },
    });

    // Output the URL of the Lambda Function
    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}/api/hello`,
      description: "The URL of the CloudFront Distribution",
    });
  }
}
