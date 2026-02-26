import { join } from 'path';
import {
  CustomResource,
  Duration,
} from 'aws-cdk-lib';
import type { IRepository } from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export interface EcrScanAlertProps {
  /**
   * ECR image URI in the repository where scan-on-push runs (destination repo + tag).
   */
  readonly imageUri: string;

  /**
   * ECR repository containing the image (where scan runs). Used for IAM.
   */
  readonly repository: IRepository;

  /**
   * GitHub owner (org or user).
   */
  readonly githubOwner?: string;

  /**
   * GitHub repository name.
   */
  readonly githubRepo?: string;

  /**
   * Name of Secrets Manager secret containing the GitHub token.
   */
  readonly githubTokenSecretName?: string;

  /**
   * If set, comment on this PR instead of creating an issue.
   */
  readonly prNumber?: number;

  /**
   * Severities that cause failure. Comma-separated: CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL, UNDEFINED.
   * @default ['CRITICAL', 'HIGH']
   */
  readonly severityThreshold?: string[];

  /**
   * Suppress errors during CloudFormation rollback to avoid ROLLBACK_FAILED.
   * @default true
   */
  readonly suppressErrorOnRollback?: boolean;

  /**
   * When true, deployment fails if vulnerabilities above severity threshold are found.
   * When false, deployment proceeds but GitHub comments are still posted.
   * @default true
   */
  readonly blockDeployment?: boolean;
}

export class EcrScanAlert extends Construct {
  constructor(scope: Construct, id: string, props: EcrScanAlertProps) {
    super(scope, id);

    const handlerEntry = join(__dirname, 'ecr-scan-handler', 'index.ts');

    const onEventFn = new NodejsFunction(this, 'OnEvent', {
      entry: handlerEntry,
      handler: 'onEvent',
      timeout: Duration.seconds(30),
      runtime: Runtime.NODEJS_22_X,
      bundling: {
        externalModules: ['@aws-sdk/client-cloudformation', '@aws-sdk/client-ecr', '@aws-sdk/client-secrets-manager'],
      }
    });

    const isCompleteFn = new NodejsFunction(this, 'IsComplete', {
      entry: handlerEntry,
      handler: 'isComplete',
      timeout: Duration.minutes(2),
      runtime: Runtime.NODEJS_22_X,
      bundling: {
        externalModules: ['@aws-sdk/client-cloudformation', '@aws-sdk/client-ecr', '@aws-sdk/client-secrets-manager'],
      }
    });

    // ECR StartImageScan (onEvent starts the scan explicitly)
    onEventFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecr:StartImageScan'],
      resources: [props.repository.repositoryArn],
    }));

    // ECR DescribeImageScanFindings (isComplete polls until done)
    isCompleteFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecr:DescribeImageScanFindings'],
      resources: [props.repository.repositoryArn],
    }));
    isCompleteFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudformation:DescribeStacks'],
      resources: ['*'],
    }));

    if (props.githubTokenSecretName) {
      const githubTokenSecret = secrets.Secret.fromSecretNameV2(this, 'GitHubTokenSecret', props.githubTokenSecretName);
      githubTokenSecret.grantRead(isCompleteFn);
    }

    const provider = new Provider(this, 'Provider', {
      onEventHandler: onEventFn,
      isCompleteHandler: isCompleteFn,
      queryInterval: Duration.seconds(30),
      totalTimeout: Duration.minutes(15),
    });

    new CustomResource(this, 'Resource', {
      resourceType: 'Custom::EcrScanAlert',
      serviceToken: provider.serviceToken,
      properties: {
        addr: this.node.addr,
        imageUri: props.imageUri,
        severityThreshold: props.severityThreshold,
        suppressErrorOnRollback: String(props.suppressErrorOnRollback ?? true),
        blockDeployment: String(props.blockDeployment ?? true),
        githubOwner: props.githubOwner,
        githubRepo: props.githubRepo,
        githubTokenSecretName: props.githubTokenSecretName,
        prNumber: props.prNumber,
      },
    });
  }
}
