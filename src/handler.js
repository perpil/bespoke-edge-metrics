let counter = 0;

export async function handler(event, context) {
  return {
    statusCode: 200,
    body: { message: "OK" },
    headers: {
      "x-meta-coldstart": `${counter++ === 0}`,
      "x-meta-namespace": `OriginMetrics/${process.env.AWS_LAMBDA_FUNCTION_NAME}`,
      "x-meta-version": process.env.AWS_LAMBDA_FUNCTION_VERSION,
      "x-meta-requestid": context.awsRequestId,
    },
  };
}
