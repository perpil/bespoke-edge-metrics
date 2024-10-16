async function handler(event) {
  if (event.context.eventType == "viewer-request") {
    // inject edge request time header
    event.request.headers["x-request-time"] = { value: Date.now().toString() };
    return event.request;
  } else if (event.context.eventType == "viewer-response") {
    // build EMF metric from API response headers
    let metrics = {
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: getHeader(
              event.response,
              "x-meta-namespace",
              "OriginMetrics/Default"
            ),
            Dimensions: [["functionVersion", "coldstart"]],
            Metrics: [
              {
                Name: "originLatency",
                Unit: "Milliseconds",
                StorageResolution: 60,
              },
            ],
          },
        ],
      },
      originLatency:
        Date.now() - new Date(+getHeader(event.request, "x-request-time")),
      requestId: getHeader(event.response, "x-meta-requestid"),
      functionVersion: getHeader(event.response, "x-meta-version", 0),
      coldstart: getHeader(event.response, "x-meta-coldstart", "false"),
      cfCity: getHeader(event.request, "cloudfront-viewer-city"),
      cfCountry: getHeader(event.request, "cloudfront-viewer-country"),
    };
    console.log(JSON.stringify(metrics));
    // strip headers that have x-meta- prefix
    for (let key in event.response.headers) {
      if (key.startsWith("x-meta-")) {
        delete event.response.headers[key];
      }
    }
    return event.response;
  }
}

function getHeader(source, header, defaultValue) {
  return (
    source.headers[header] || {
      value: defaultValue,
    }
  ).value;
}
