import type { ImageScanFindings } from '@aws-sdk/client-ecr';
import {
  formatFindingsReport,
  formatScanSuccessReport,
} from '../lambda/ecr-scan-handler/github';

describe('formatScanSuccessReport', () => {
  it('includes image URI and marker', () => {
    const report = formatScanSuccessReport('123.dkr.ecr.us-east-1.amazonaws.com/repo:v1');
    expect(report).toContain('## ECR image scan passed');
    expect(report).toContain('123.dkr.ecr.us-east-1.amazonaws.com/repo:v1');
    expect(report).toContain('<!-- EcrScanOnPushCheck -->');
    expect(report).toContain('No vulnerabilities found');
  });

  it('contains timestamp and marker', () => {
    const report = formatScanSuccessReport('repo:tag');
    expect(report).toMatch(/EcrScanOnPushCheck · \d{4}-\d{2}-\d{2}T/);
  });
});

describe('formatFindingsReport', () => {
  const baseFindings: ImageScanFindings = {
    imageScanCompletedAt: new Date('2025-01-15T12:00:00Z'),
    findingSeverityCounts: { CRITICAL: 1, HIGH: 2 },
    findings: [
      {
        name: 'CVE-2024-1234',
        severity: 'CRITICAL',
        uri: 'https://nvd.nist.gov/foo',
        attributes: [{ key: 'package_name', value: 'openssl' }],
        description: 'A critical vulnerability',
      },
      {
        name: 'CVE-2024-5678',
        severity: 'HIGH',
        attributes: [{ key: 'package_name', value: 'libcurl' }],
        description: 'High severity issue',
      },
    ],
  };

  it('includes image URI, severity counts, and findings table', () => {
    const report = formatFindingsReport(
      '123.dkr.ecr.us-east-1.amazonaws.com/repo:v1',
      ['CRITICAL', 'HIGH'],
      { CRITICAL: 1, HIGH: 2 },
      baseFindings,
    );
    expect(report).toContain('## ECR image scan failed');
    expect(report).toContain('123.dkr.ecr.us-east-1.amazonaws.com/repo:v1');
    expect(report).toContain('CRITICAL');
    expect(report).toContain('HIGH');
    expect(report).toContain('CVE-2024-1234');
    expect(report).toContain('CVE-2024-5678');
    expect(report).toContain('openssl');
    expect(report).toContain('libcurl');
    expect(report).toContain('<!-- EcrScanOnPushCheck -->');
  });

  it('links findings with URI when present', () => {
    const report = formatFindingsReport(
      'repo:tag',
      ['CRITICAL'],
      { CRITICAL: 1 },
      baseFindings,
    );
    expect(report).toContain('[CVE-2024-1234](https://nvd.nist.gov/foo)');
  });

  it('filters findings by severity threshold', () => {
    const findingsWithLow: ImageScanFindings = {
      ...baseFindings,
      findingSeverityCounts: { CRITICAL: 1, HIGH: 2, LOW: 5 },
      findings: [
        ...(baseFindings.findings ?? []),
        {
          name: 'CVE-LOW',
          severity: 'LOW',
          attributes: [{ key: 'package_name', value: 'lowpkg' }],
          description: 'Low severity',
        },
      ],
    };
    const report = formatFindingsReport(
      'repo:tag',
      ['CRITICAL', 'HIGH'],
      { CRITICAL: 1, HIGH: 2, LOW: 5 },
      findingsWithLow,
    );
    expect(report).toContain('CVE-2024-1234');
    expect(report).toContain('CVE-2024-5678');
    expect(report).not.toContain('CVE-LOW');
    expect(report).not.toContain('lowpkg');
  });

  it('uses imageScanCompletedAt for timestamp when available', () => {
    const report = formatFindingsReport(
      'repo:tag',
      ['CRITICAL'],
      { CRITICAL: 1 },
      baseFindings,
    );
    expect(report).toContain('2025-01-15T12:00:00');
  });
});
