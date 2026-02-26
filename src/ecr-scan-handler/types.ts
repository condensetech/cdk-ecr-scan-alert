import type { ImageScanFindings } from '@aws-sdk/client-ecr';

/**
 * Custom resource properties passed from EcrScanOnPushCheck construct.
 */
export interface EcrScanHandlerProps {
  addr: string;
  /** ECR image URI (e.g. 123456.dkr.ecr.region.amazonaws.com/repo:tag) */
  imageUri: string;
  /** Severities that cause failure: CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL, UNDEFINED */
  severityThreshold?: string[];
  suppressErrorOnRollback: string;
  /** When 'true', deployment fails on findings. When 'false', deployment proceeds but GH comments are still posted. */
  blockDeployment?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubTokenSecretName?: string;
  prNumber?: number;
}

/** CloudFormation custom resource event payload. */
export interface CdkEvent {
  RequestType: string;
  PhysicalResourceId?: string;
  ResourceProperties?: Record<string, unknown>;
  StackId?: string;
}

/** Parsed ECR image URI components. */
export interface ParsedImageUri {
  repositoryName: string;
  imageTag: string;
  registryId?: string;
}

/** Single finding row for the GitHub report table. */
export interface FindingRow {
  id: string;
  severity: string;
  package: string;
  description: string;
  uri?: string;
  fix?: string;
}

export type { ImageScanFindings };
