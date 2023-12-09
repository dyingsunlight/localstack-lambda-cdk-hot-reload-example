# Getting start
This is a minimal example that localstack fails to start lambda hot-reload.

## How to reproduce

simple install docker and command `docker compose up` to start.

```
localstack-hot-reload-cdk-1         | Outputs:
localstack-hot-reload-cdk-1         | test-localstack-hot-reload.RestAPIEndpointB14C3C54 = https://ysmwcnfjml.execute-api.localhost.localstack.cloud:4566/prod/
```
when localstack deploy succeed, modify and visit the link:
```
https://<RestAPIEndpoint>.execute-api.localhost.localstack.cloud:14566/prod/hello-world
```
And you may see the error logs.
```logs
localstack-hot-reload-localstack-1  | 2023-12-09T18:50:40.911  INFO --- [   asgi_gw_2] l.u.container_networking   : Determined main container network: localstack-hot-reload_default
localstack-hot-reload-localstack-1  | 2023-12-09T18:50:40.918  INFO --- [   asgi_gw_2] l.u.container_networking   : Determined main container target IP: 172.22.0.2
localstack-hot-reload-localstack-1  | 2023-12-09T18:50:41.393  WARN --- [   asgi_gw_3] l.s.l.i.executor_endpoint  : Execution environment startup failed: {"errorType":"Runtime.ImportModuleError","errorMessage":"Error: Cannot fin
d module '/var/task/lambda/hello-world.js'\nRequire stack:\n- /var/runtime/index.mjs","trace":["Runtime.ImportModuleError: Error: Cannot find module '/var/task/lambda/hello-world.js'","Require stack:","- /var/runtime/index.mjs",
"    at _loadUserApp (file:///var/runtime/index.mjs:1087:17)","    at async UserFunction.js.module.exports.load (file:///var/runtime/index.mjs:1119:21)","    at async start (file:///var/runtime/index.mjs:1282:23)","    at async 
file:///var/runtime/index.mjs:1288:1"]}
localstack-hot-reload-localstack-1  | 2023-12-09T18:50:41.393  INFO --- [   asgi_gw_3] localstack.request.http    : POST /_localstack_lambda/2afb0fc5ca2d29fa8aafa6e3374a57c1/status/2afb0fc5ca2d29fa8aafa6e3374a57c1/error => 202
localstack-hot-reload-localstack-1  | 2023-12-09T18:50:41.393  WARN --- [   asgi_gw_2] l.s.l.i.execution_environm : Failed to start execution environment 2afb0fc5ca2d29fa8aafa6e3374a57c1: Environment startup failed
localstack-hot-reload-localstack-1  | 2023-12-09T18:50:41.393  WARN --- [   asgi_gw_2] l.s.l.i.execution_environm : Execution environment 2afb0fc5ca2d29fa8aafa6e3374a57c1 for function arn:aws:lambda:us-east-1:000000000000:functi
on:hello-world:$LATEST failed during startup. Check for errors during the startup of your Lambda function.
localstack-hot-reload-localstack-1  | 2023-12-09T18:50:41.718  WARN --- [   asgi_gw_0] l.s.apigateway.integration : Lambda output should follow the next JSON format: { "isBase64Encoded": true|false, "statusCode": httpStatusCode,
 "headers": { "headerName": "headerValue", ... },"body": "..."}
localstack-hot-reload-localstack-1  | 2023-12-09T18:50:41.718  INFO --- [   asgi_gw_0] localstack.request.http    : GET /prod/hello-world => 502
localstack-hot-reload-localstack-1  | 2023-12-09T18:50:41.821  INFO --- [   asgi_gw_3] localstack.request.http    : GET /favicon.ico => 404
```

## Another way make it works
if change the lambda code source from hot reload bucket to zip assets, then the error disappeared and everything works fine.


`projects/cdk/lib/dev-app.ts` find the code
```typescript
const lambda = new Function(this, route.name, {
  functionName: route.name,
  runtime: Runtime.NODEJS_18_X,
  timeout: cdk.Duration.seconds(120),
  handler: route.handler,
  code: Code.fromBucket(
    hotReloadingBucket,
    path.resolve(serverDir)
  ),
  // code: Code.fromAsset(path.resolve(serverDir)),
  memorySize: 128,
})
```
Change it to
```typescript
const lambda = new Function(this, route.name, {
  functionName: route.name,
  runtime: Runtime.NODEJS_18_X,
  timeout: cdk.Duration.seconds(120),
  handler: route.handler,
  code: Code.fromAsset(path.resolve(serverDir)),
  memorySize: 128,
})
```
