# Getting start
This is a minimal example that using following things:
- docker compose 
- localstack start aws lambda in hot-reload.
- aws cdk

The only thing requirement is docker, starts with command: `docker compose up`

## Notice
### Window user must enable wsl2 with docker desktop.
And uses wsl to run docker compose.
```shell
wsl docker compose up
```

## What is important?
The key is how to run a docker container in a docker container. 
Volume binding are only will work from `host` to `container` instead of from `container` to `container`. 
Which means you must pass the `host`  binding volume path fully to your `container` to create a new `container` likes the aws sam lambda invoke.
Otherwise, you will encounter issue likes:

localstack mount code (hot-reload):
```
WARN --- [   asgi_gw_3] l.s.l.i.executor_endpoint  : Execution environment startup failed: {"errorType":"Runtime.ImportModuleError","errorMessage":"Error: Cannot fin
d module 'hello-world'\nRequire stack:\n- /var/runtime/index.mjs","trace":["Runtime.ImportModuleError: Error: Cannot find module 'hello-world'","Require stack:","- /var/runtime/index.mjs","    at _loadUserApp (file:///var/runtim
e/index.mjs:1087:17)","    at async UserFunction.js.module.exports.load (file:///var/runtime/index.mjs:1119:21)","    at async start (file:///var/runtime/index.mjs:1282:23)","    at async file:///var/runtime/index.mjs:1288:1"]}
```
or
try to run aws sam in container errors:
```
undefined       ERROR   Uncaught Exception      {"errorType":"Runtime.ImportModuleError","errorMessage":"Error: Cannot find module 'app'\nRequire stack:\n- /var/runtime/index.mjs",
ile:///var/runtime/index.mjs:1119:21)","    at async start (file:///var/runtime/index.mjs:1282:23)","    at async file:///var/runtime/index.mjs:1288:1"]}
```

### Fix the error
Add `- ${PWD}:${PWD}:ro` volume binding in the docker compose file.
```
version: "3.9"

services:
  localstack:
    image: localstack/localstack:3.0.2
    ports:
      - ":4566:4566"
      - ":4510-4559:4510-4559"
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock
      - AWS_ACCESS_KEY_ID= test
      - AWS_SECRET_ACCESS_KEY=test
      - AWS_DEFAULT_REGION=us-east-1
    volumes:
      - .dev/localstack:/var/lib/localstack
      - /var/run/docker.sock:/var/run/docker.sock
      - ./projects/server:/var/workspaces/server
      - ${PWD}:${PWD}:ro
```
Or for aws sam user:
```
version: "3.9"

services:
  sam:
    build:
      dockerfile: sam.Dockerfile
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock
      - SAM_CLI_CONTAINER_CONNECTION_TIMEOUT=180
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock #Needed so a docker container can be run from inside a docker container
      - ~/.aws/:/root/.aws:ro
      - ${PWD}:${PWD}:ro
    working_dir: /${PWD}
    command:
      - sam
      - local
      - start-api
      - --debug
      - --template
      - template.yaml
      - --host
      - 0.0.0.0
      - --skip-pull-image
      - --container-host
      - host.docker.internal
      - --docker-volume-basedir # This is necessary for sam command to mount the directory.
      - ${PWD}
    ports:
      - "9001:3000"
```

