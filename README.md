# Bespoke CloudFront Edge Metrics

This is the companion repo for the blog post: [Bespoke CloudFront Edge Metrics](https://speedrun.nobackspacecrew.com/blog/2024/10/16/bespoke-cloudfront-edge-metrics.html) The stack will create a CloudFront distribution that uses a CloudFront function to emit latency metrics and queryable logs for a Lambda function as measured by the CloudFront edge.

## Interesting files

1. [`lib/bespoke-edge-metrics-stack.mjs`](lib/bespoke-edge-metrics-stack.mjs) - The CDK stack that creates the CloudFront distribution, CloudFront functions, Lambda Function/Function Url.
1. [`cloudfront-functions/metricsAspect.js`](cloudfront-functions/metricsAspect.js) The CloudFront function that injects the `x-request-time` header and processes all of the `x-meta-*` response headers from the lambda function to emit a latency metric in the EMF format to the log.
1. [`src/handler.js`](src/handler.js) - The Lambda function that sets response headers so they are accessible in the CloudFront Function.


## Setup

```
npm install
```

If you've never used the [CDK](https://aws.amazon.com/cdk/) before, run:

```
npx cdk bootstrap
```

## Deploy

```
npx cdk deploy
```

## Usage

**Outputs** will print the url for the CloudFront distribution.

```
BespokeEdgeMetricsStack.CloudFrontUrl = https://d1xxxxxxxxxxxx.cloudfront.net/api/hello
```

Hit the url a few times, then if you are logged into the AWS console, use these links to see your metrics and logs.  There may be an initial delay of 2-3 minutes before your metrics and logs are available.

You can see the metrics in CloudWatch Metrics [here](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#metricsV2?graph=~(metrics~(~(~'OriginMetrics*2fEdgeMetricsFunction~'originLatency~'functionVersion~'1~'coldstart~'false~(label~'noncoldstart))~(~'...~'true~(label~'coldstart)))~view~'timeSeries~stacked~false~region~'us-east-1~title~'Latency*20By*20Version~stat~'Average~period~300~yAxis~(left~(min~0~showUnits~false)))&query=~'*7bOriginMetrics*2fEdgeMetricsFunction*2ccoldstart*2cfunctionVersion*7d)

You can see the logs in CloudWatch Logs [here](https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:logs-insights$3FqueryDetail$3D~(end~0~start~-3600~timeType~'RELATIVE~tz~'UTC~unit~'seconds~editorString~'filter*20strcontains*28*40message*2c*20*27_aws*27*29*20*7c*0aparse*20*40message*20*22*5c*22originLatency*5c*22*3a*2a*2c*22*20as*20originLatency*20*7c*0aparse*20*40message*20*22*5c*22requestId*5c*22*3a*5c*22*2a*5c*22*22*20as*20requestId*20*7c*0aparse*20*40message*20*22*5c*22functionVersion*5c*22*3a*5c*22*2a*5c*22*22*20as*20functionVersion*20*7c*0aparse*20*40message*20*22*5c*22coldstart*5c*22*3a*5c*22*2a*5c*22*22*20as*20coldstart*20*7c*0aparse*20*40message*20*22*5c*22cfCity*5c*22*3a*5c*22*2a*5c*22*22*20as*20cfCity*20*7c*0aparse*20*40message*20*22*5c*22cfCountry*5c*22*3a*5c*22*2a*5c*22*22*20as*20cfCountry*20*7c*0astats*20avg*28originLatency*29*20by*20functionVersion*2c*20coldstart*2ccfCity*2ccfCountry~queryId~'850eb762-0241-404d-a302-fa177a737158~source~(~'*2faws*2fcloudfront*2ffunction*2fmetricsAspect)))

## Tearing down
```
npx cdk destroy
```

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
