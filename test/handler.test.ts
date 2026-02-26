import { onEvent, isComplete } from '../lambda/ecr-scan-handler';
import * as cloudformation from '../lambda/ecr-scan-handler/cloudformation';
import * as ecr from '../lambda/ecr-scan-handler/ecr';
import * as github from '../lambda/ecr-scan-handler/github';
import type { CdkEvent } from '../lambda/ecr-scan-handler/types';

jest.mock('../lambda/ecr-scan-handler/ecr');
jest.mock('../lambda/ecr-scan-handler/github', () => {
  const actual = jest.requireActual<typeof import('../lambda/ecr-scan-handler/github')>('../lambda/ecr-scan-handler/github');
  return {
    ...actual,
    alertGitHub: jest.fn(),
    updatePrCommentIfExists: jest.fn(),
  };
});
jest.mock('../lambda/ecr-scan-handler/cloudformation');

const mockStartImageScan = ecr.startImageScan as jest.MockedFunction<typeof ecr.startImageScan>;
const mockGetImageScanFindings = ecr.getImageScanFindings as jest.MockedFunction<typeof ecr.getImageScanFindings>;
const mockAlertGitHub = github.alertGitHub as jest.MockedFunction<typeof github.alertGitHub>;
const mockUpdatePrCommentIfExists = github.updatePrCommentIfExists as jest.MockedFunction<typeof github.updatePrCommentIfExists>;
const mockIsRollbackInProgress = cloudformation.isRollbackInProgress as jest.MockedFunction<typeof cloudformation.isRollbackInProgress>;

const baseProps: Record<string, unknown> = {
  addr: 'test-addr',
  imageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/my-repo:v1',
  suppressErrorOnRollback: 'true',
};

function createEvent(
  requestType: string,
  overrides: Partial<{ RequestType: string; PhysicalResourceId?: string; ResourceProperties?: Record<string, unknown>; StackId?: string }> = {},
): CdkEvent {
  return {
    RequestType: requestType,
    PhysicalResourceId: undefined,
    ResourceProperties: { ...baseProps },
    StackId: 'arn:aws:cloudformation:us-east-1:123456789012:stack/Test/abc',
    ...overrides,
  } as CdkEvent;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('onEvent', () => {
  it('returns PhysicalResourceId on Delete', async () => {
    const event = createEvent('Delete', { PhysicalResourceId: 'existing-id' });
    const result = await onEvent(event);
    expect(result).toEqual({ PhysicalResourceId: 'existing-id' });
    expect(mockStartImageScan).not.toHaveBeenCalled();
  });

  it('starts scan and returns physical id on Create', async () => {
    mockStartImageScan.mockResolvedValueOnce(undefined);
    const event = createEvent('Create');
    const result = await onEvent(event);
    expect(mockStartImageScan).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryName: 'my-repo',
        imageTag: 'v1',
        registryId: '123456789012',
      }),
    );
    expect(result).toMatchObject({
      PhysicalResourceId: 'test-addr-123456789012.dkr.ecr.us-east-1.amazonaws.com/my-repo:v1',
    });
  });

  it('throws when addr or imageUri missing', async () => {
    const event = createEvent('Create', { ResourceProperties: { imageUri: 'x' } as Record<string, unknown> });
    await expect(onEvent(event)).rejects.toThrow('addr and imageUri are required');
  });
});

describe('isComplete', () => {
  it('returns IsComplete: true on Delete', async () => {
    const event = createEvent('Delete');
    const result = await isComplete(event);
    expect(result).toEqual({ IsComplete: true });
    expect(mockGetImageScanFindings).not.toHaveBeenCalled();
  });

  it('returns IsComplete: false when scan not complete yet', async () => {
    mockGetImageScanFindings.mockResolvedValueOnce(undefined);
    const event = createEvent('Create');
    const result = await isComplete(event);
    expect(result).toEqual({ IsComplete: false });
  });

  it('returns IsComplete: false when scan status is IN_PROGRESS', async () => {
    mockGetImageScanFindings.mockResolvedValueOnce({
      imageScanStatus: { status: 'IN_PROGRESS' },
    } as any);
    const event = createEvent('Create');
    const result = await isComplete(event);
    expect(result).toEqual({ IsComplete: false });
  });

  it('throws when scan status is FAILED', async () => {
    mockGetImageScanFindings.mockResolvedValueOnce({
      imageScanStatus: { status: 'FAILED', description: 'Image not found' },
    } as any);
    const event = createEvent('Create');
    await expect(isComplete(event)).rejects.toThrow('ECR image scan failed: Image not found');
  });

  it('returns IsComplete: true when no blocking findings', async () => {
    mockGetImageScanFindings.mockResolvedValueOnce({
      imageScanStatus: { status: 'COMPLETE' },
      imageScanFindings: {
        findingSeverityCounts: { LOW: 1 },
        findings: [],
        enhancedFindings: [],
      },
    } as any);
    const event = createEvent('Create');
    const result = await isComplete(event);
    expect(result).toEqual({ IsComplete: true });
  });

  it('calls updatePrCommentIfExists when no findings and github+prNumber configured', async () => {
    mockGetImageScanFindings.mockResolvedValueOnce({
      imageScanStatus: { status: 'COMPLETE' },
      imageScanFindings: {
        findingSeverityCounts: {},
        findings: [],
        enhancedFindings: [],
      },
    } as any);
    const event = createEvent('Create', {
      ResourceProperties: { ...baseProps, github: { owner: 'org', repo: 'repo', tokenSecretName: 'secret', prNumber: 42 } },
    });
    const result = await isComplete(event);
    expect(result).toEqual({ IsComplete: true });
    expect(mockUpdatePrCommentIfExists).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'org', repo: 'repo', prNumber: 42, imageUri: baseProps.imageUri }),
      expect.stringMatching(/ECR image scan passed/),
    );
  });

  it('throws when CRITICAL/HIGH findings and blockDeployment true', async () => {
    mockGetImageScanFindings.mockResolvedValueOnce({
      imageScanStatus: { status: 'COMPLETE' },
      imageScanFindings: {
        findingSeverityCounts: { CRITICAL: 1, HIGH: 2 },
        findings: [
          {
            name: 'CVE-1',
            severity: 'CRITICAL',
            attributes: [{ key: 'package_name', value: 'pkg' }],
            description: 'Critical',
          },
        ],
        enhancedFindings: [],
      },
    } as any);
    const event = createEvent('Create');
    await expect(isComplete(event)).rejects.toThrow('ECR scan found vulnerabilities (CRITICAL: 1, HIGH: 2). Deployment blocked.');
  });

  it('calls alertGitHub when vulnerabilities found and github configured', async () => {
    mockGetImageScanFindings.mockResolvedValueOnce({
      imageScanStatus: { status: 'COMPLETE' },
      imageScanFindings: {
        findingSeverityCounts: { CRITICAL: 1 },
        findings: [
          {
            name: 'CVE-1',
            severity: 'CRITICAL',
            attributes: [{ key: 'package_name', value: 'pkg' }],
            description: 'Critical',
          },
        ],
        enhancedFindings: [],
        imageScanCompletedAt: new Date(),
      },
    } as any);
    const event = createEvent('Create', {
      ResourceProperties: { ...baseProps, github: { owner: 'org', repo: 'repo', tokenSecretName: 'secret' } },
    });
    await expect(isComplete(event)).rejects.toThrow('Deployment blocked');
    expect(mockAlertGitHub).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'org', repo: 'repo', imageUri: baseProps.imageUri }),
      expect.stringMatching(/ECR image scan failed/),
    );
  });

  it('returns IsComplete: true when blockDeployment is false despite findings', async () => {
    mockGetImageScanFindings.mockResolvedValueOnce({
      imageScanStatus: { status: 'COMPLETE' },
      imageScanFindings: {
        findingSeverityCounts: { CRITICAL: 1 },
        findings: [
          {
            name: 'CVE-1',
            severity: 'CRITICAL',
            attributes: [{ key: 'package_name', value: 'pkg' }],
            description: 'Critical',
          },
        ],
        enhancedFindings: [],
      },
    } as any);
    const event = createEvent('Create', {
      ResourceProperties: { ...baseProps, blockDeployment: 'false' },
    });
    const result = await isComplete(event);
    expect(result).toEqual({ IsComplete: true });
  });

  it('returns IsComplete: true during rollback when suppressErrorOnRollback is true', async () => {
    mockGetImageScanFindings.mockResolvedValueOnce({
      imageScanStatus: { status: 'COMPLETE' },
      imageScanFindings: {
        findingSeverityCounts: { CRITICAL: 1 },
        findings: [
          {
            name: 'CVE-1',
            severity: 'CRITICAL',
            attributes: [{ key: 'package_name', value: 'pkg' }],
            description: 'Critical',
          },
        ],
        enhancedFindings: [],
      },
    } as any);
    mockIsRollbackInProgress.mockResolvedValueOnce(true);
    const event = createEvent('Create');
    const result = await isComplete(event);
    expect(result).toEqual({ IsComplete: true });
  });
});
