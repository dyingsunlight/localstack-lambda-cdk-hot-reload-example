import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam"
import { Bucket } from "aws-cdk-lib/aws-s3"
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda"
import * as path from "path"
import {
  Cors, IResource,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway"

interface AppStackProps extends cdk.StackProps {
}

class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props)

    const lambdaRole = new Role(this, "LambdaRole", {
      assumedBy: new ServicePrincipal("lambda.amazon.com"),
    })
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    )

    const api = new RestApi(this, "RestAPI", {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    })

    const serverDir = path.resolve(process.env.SERVER_DIR as string, 'projects/server')
    console.log('serverDir', serverDir)
    const serverRoutes = [
      {
        name: 'hello-world',
        handler: 'lambda/hello-world.handler',
        path: '/hello-world',
        methods: ['GET']
      }
    ]
    const hotReloadingBucket = Bucket.fromBucketName(
        this,
        "hot-reload",
        "hot-reload"
    )
    for (const route of serverRoutes) {
      const lambda = new Function(this, route.name, {
        functionName: route.name,
        runtime: Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(120),
        handler: route.handler,
        // This hot reload bucket source are not working for now.
        code: Code.fromBucket(
          hotReloadingBucket,
            serverDir
        ),
        // This will works fine.
        // code: Code.fromAsset(path.resolve(serverDir)),
        memorySize: 128,
      })
      const lambdaIntegration = new LambdaIntegration(lambda)
      const resources: IResource[] = []
      let lastResource: IResource = api.root
      for (const segment of route.path.split('/').filter(Boolean)) {
        const resource = lastResource.addResource(segment)
        resources.push(resource)
        lastResource = resource
      }
      for (const method of route.methods) {
        lastResource.addMethod(method.toUpperCase(), lambdaIntegration)
      }
    }
  }
}

const app = new cdk.App()

new AppStack(app, 'test-localstack-hot-reload', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
})

app.synth()

