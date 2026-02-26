/**
 * ECR Scan on Push Check – CloudFormation Custom Resource handlers.
 *
 * onEvent: Starts ECR image scan (Create/Update).
 * isComplete: Polls until scan completes, evaluates findings, optionally posts to GitHub.
 */
import { isRollbackInProgress } from './cloudformation';
import { startImageScan, getImageScanFindings } from './ecr';
import { formatFindingsReport, formatScanSuccessReport, alertGitHub, updatePrCommentIfExists } from './github';
import { parseImageUri } from './image-uri';
import type { CdkEvent, EcrScanHandlerProps } from './types';

export type { EcrScanHandlerProps } from './types';

const DEFAULT_SEVERITY_THRESHOLD = ['CRITICAL', 'HIGH'];

function getProps(event: CdkEvent): EcrScanHandlerProps {
  return event.ResourceProperties as unknown as EcrScanHandlerProps;
}

function requireProps(props: Partial<EcrScanHandlerProps>): asserts props is EcrScanHandlerProps & { addr: string; imageUri: string } {
  if (!props.addr || !props.imageUri) {
    throw new Error('addr and imageUri are required.');
  }
}

function getSeverityThreshold(props: EcrScanHandlerProps): string[] {
  const raw = props.severityThreshold ?? DEFAULT_SEVERITY_THRESHOLD;
  const arr = Array.isArray(raw) ? raw : String(raw).split(',').map(s => s.trim());
  return arr.map(s => s.toUpperCase());
}

export async function onEvent(event: CdkEvent) {
  const props = getProps(event);
  requireProps(props);

  const physicalId = `${props.addr}-${props.imageUri}`;

  if (event.RequestType === 'Delete') {
    return { PhysicalResourceId: event.PhysicalResourceId ?? physicalId };
  }

  const parsed = parseImageUri(props.imageUri);
  await startImageScan(parsed);

  return { PhysicalResourceId: physicalId, ...props };
}

export async function isComplete(event: CdkEvent) {
  const props = getProps(event);
  requireProps(props);

  if (event.RequestType === 'Delete') {
    return { IsComplete: true };
  }

  const parsed = parseImageUri(props.imageUri);
  const response = await getImageScanFindings(parsed);

  if (!response) {
    return { IsComplete: false };
  }

  const status = response.imageScanStatus?.status ?? '';

  if (status === 'PENDING' || status === 'IN_PROGRESS') {
    return { IsComplete: false };
  }

  if (status === 'FAILED') {
    const desc = response.imageScanStatus?.description ?? 'Scan failed';
    throw new Error(`ECR image scan failed: ${desc}`);
  }

  // status === COMPLETE
  const severityThreshold = getSeverityThreshold(props);
  const counts = (response.imageScanFindings?.findingSeverityCounts ?? {}) as Record<string, number>;

  const findingsSummary: string[] = [];
  let hasBlockingFindings = false;

  for (const sev of severityThreshold) {
    const count = counts[sev] ?? 0;
    if (count > 0) {
      hasBlockingFindings = true;
      findingsSummary.push(`${sev}: ${count}`);
    }
  }

  if (!hasBlockingFindings) {
    const g = props.github;
    if (g?.owner && g?.repo && g?.tokenSecretName && g.prNumber != null) {
      try {
        const successBody = formatScanSuccessReport(props.imageUri);
        await updatePrCommentIfExists({ ...g, imageUri: props.imageUri }, successBody);
      } catch (e) {
        console.error('Failed to update PR comment with scan success:', e);
      }
    }
    return { IsComplete: true };
  }

  const findingsStr = findingsSummary.join(', ');
  const reportBody = formatFindingsReport(
    props.imageUri,
    severityThreshold,
    counts,
    response.imageScanFindings!,
  );

  if (props.github?.owner && props.github?.repo && props.github?.tokenSecretName) {
    try {
      await alertGitHub({ ...props.github, imageUri: props.imageUri }, reportBody);
    } catch (e) {
      console.error('Failed to create GitHub alert:', e);
    }
  }

  if (
    props.suppressErrorOnRollback === 'true' &&
    event.StackId &&
    (await isRollbackInProgress(event.StackId))
  ) {
    return { IsComplete: true };
  }

  if (props.blockDeployment === 'false') {
    console.log(`ECR scan found vulnerabilities (${findingsStr}). blockDeployment=false, allowing deployment.`);
    return { IsComplete: true };
  }

  throw new Error(`ECR scan found vulnerabilities (${findingsStr}). Deployment blocked.`);
}
