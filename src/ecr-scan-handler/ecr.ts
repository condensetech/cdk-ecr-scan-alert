import {
  ECRClient,
  DescribeImageScanFindingsCommand,
  StartImageScanCommand,
} from '@aws-sdk/client-ecr';
import type { ParsedImageUri } from './types';

const ecrClient = new ECRClient();

/**
 * Start ECR image scan. Idempotent: LimitExceededException (scan in progress) is treated as success.
 */
export async function startImageScan(parsed: ParsedImageUri): Promise<void> {
  try {
    await ecrClient.send(new StartImageScanCommand({
      repositoryName: parsed.repositoryName,
      imageId: { imageTag: parsed.imageTag },
      registryId: parsed.registryId,
    }));
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'LimitExceededException') {
      console.log('StartImageScan limit exceeded (scan may already be running), continuing...');
      return;
    }
    throw err;
  }
}

/**
 * Fetch scan findings. Returns undefined if scan not started yet (poll again).
 */
export async function getImageScanFindings(parsed: ParsedImageUri) {
  try {
    return await ecrClient.send(new DescribeImageScanFindingsCommand({
      repositoryName: parsed.repositoryName,
      imageId: { imageTag: parsed.imageTag },
      registryId: parsed.registryId,
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ScanNotFoundException') || msg.includes('ImageNotFoundException')) {
      return undefined;
    }
    throw err;
  }
}
