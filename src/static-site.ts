import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

const app = new cdk.App();

const stack = new cdk.Stack(app, "SdkCloudfrontStack", {
  env: {
    region: "eu-central-1",
  },
});

const bucket = new s3.Bucket(stack, "WebAppBucket", {
  bucketName: "developer-course-cf-bucket",
});

const originAccessIdentity = new cf.OriginAccessIdentity(
  stack,
  "WebAppBucketOAI",
  {
    comment: bucket.bucketName,
  }
);

bucket.grantRead(originAccessIdentity);

const cloudfront = new cf.Distribution(stack, "WebAppDistribution", {
  defaultBehavior: {
    origin: new origins.S3Origin(bucket, { originAccessIdentity }),
    viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
  defaultRootObject: "index.html",
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: "/index.html",
    },
  ],
});

new deployment.BucketDeployment(stack, "DeployWebApp", {
  destinationBucket: bucket,
  sources: [deployment.Source.asset("./dist")],
  distribution: cloudfront,
  distributionPaths: ["/*"],
});

new cdk.CfnOutput(stack, "Domain URL", {
  value: cloudfront.distributionDomainName,
});

// export interface StaticSiteProps {
//   domainName: string;
//   siteSubDomain: string;
// }

// export class StaticSite extends Construct {
//   constructor(parent: Stack, name: string, props?: StaticSiteProps) {
//     super(parent, name);

//     const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, "JSCC-OAI");

//     const siteBucket = new s3.Bucket(this, "JSCCStaticBucket", {
//       bucketName: "js-cc-cloudfront-s3",
//       websiteIndexDocument: "index.html",
//       publicReadAccess: false,
//       blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
//     });

//     siteBucket.addToResourcePolicy(
//       new iam.PolicyStatement({
//         actions: ["S3:GetObject"],
//         resources: [siteBucket.arnForObjects("*")],
//         principals: [
//           new iam.CanonicalUserPrincipal(
//             cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
//           ),
//         ],
//       })
//     );

//     const distribution = new cloudfront.CloudFrontWebDistribution(
//       this,
//       "JSCC-distribution",
//       {
//         originConfigs: [
//           {
//             s3OriginSource: {
//               s3BucketSource: siteBucket,
//               originAccessIdentity: cloudfrontOAI,
//             },
//             behaviors: [
//               {
//                 isDefaultBehavior: true,
//               },
//             ],
//           },
//         ],
//       }
//     );

//     new s3deploy.BucketDeployment(this, "JSCC-Bucket-Deployment", {
//       sources: [s3deploy.Source.asset("./src")],
//       destinationBucket: siteBucket,
//       distribution,
//       distributionPaths: ["/*"],
//     });
//   }
// }
