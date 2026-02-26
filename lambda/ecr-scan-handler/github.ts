import type { ImageScanFindings } from '@aws-sdk/client-ecr';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import type { EcrScanHandlerGitHubProps, FindingRow } from './types';

const secretsClient = new SecretsManagerClient();

/** Hidden HTML comment marker to identify and update our PR comments. */
const PR_COMMENT_MARKER = '<!-- EcrScanOnPushCheck -->';

const SEVERITY_ORDER: string[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL', 'UNDEFINED'];
const SEVERITY_EMOJI: Record<string, string> = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MEDIUM: '🟡',
  LOW: '🟢',
  INFORMATIONAL: 'ℹ️',
  UNDEFINED: '⚪',
};

export function formatFindingsReport(
  imageUri: string,
  severityThreshold: string[],
  counts: Record<string, number>,
  imageScanFindings: ImageScanFindings,
): string {
  const rows = collectFindings(imageScanFindings, new Set(severityThreshold));
  const unique = dedupeFindings(rows);
  unique.sort((a, b) =>
    SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  const countLines = severityThreshold
    .filter(s => (counts[s] ?? 0) > 0)
    .map(s => `**${SEVERITY_EMOJI[s] ?? ''} ${s}:** ${counts[s]}`)
    .join(' ');

  const table = unique.length > 0
    ? buildFindingsTable(unique)
    : '';

  const timestamp = imageScanFindings.imageScanCompletedAt
    ? new Date(imageScanFindings.imageScanCompletedAt).toISOString()
    : new Date().toISOString();

  return `## ECR image scan failed

Deployment was blocked due to vulnerability findings above the configured threshold.

| | |
| :--- | :--- |
| **Image** | \`${imageUri}\` |
| **Severity counts** | ${countLines} |
${table}
---
*EcrScanOnPushCheck · ${timestamp}*
${PR_COMMENT_MARKER}`;
}

function collectFindings(
  imageScanFindings: ImageScanFindings,
  thresholdSet: Set<string>,
): FindingRow[] {
  const rows: FindingRow[] = [];

  for (const f of imageScanFindings?.findings ?? []) {
    const sev = (f.severity ?? 'UNDEFINED').toUpperCase();
    if (!thresholdSet.has(sev)) continue;
    const pkg = f.attributes?.find(a => a.key === 'package_name')?.value ?? '—';
    rows.push({
      id: f.name ?? 'Unknown',
      severity: sev,
      package: pkg,
      description: truncate(f.description, 200),
      uri: f.uri,
    });
  }

  for (const f of imageScanFindings?.enhancedFindings ?? []) {
    const sev = (f.severity ?? 'UNDEFINED').toUpperCase();
    if (!thresholdSet.has(sev)) continue;
    const vuln = f.packageVulnerabilityDetails;
    const pkgName = vuln?.vulnerablePackages?.[0]?.name ?? '—';
    const pkgVer = vuln?.vulnerablePackages?.[0]?.version;
    const pkg = pkgVer ? `${pkgName}@${pkgVer}` : pkgName;
    rows.push({
      id: vuln?.vulnerabilityId ?? f.title ?? 'Unknown',
      severity: sev,
      package: pkg,
      description: truncate(f.description, 200),
      uri: vuln?.sourceUrl,
      fix: vuln?.vulnerablePackages?.[0]?.fixedInVersion ?? f.fixAvailable,
    });
  }

  return rows;
}

function dedupeFindings(rows: FindingRow[]): FindingRow[] {
  const seen = new Set<string>();
  return rows.filter(r => {
    const key = `${r.id}:${r.package}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildFindingsTable(rows: FindingRow[]): string {
  let table = '\n### Findings\n\n| ID | Severity | Package | Fix | Description |\n| :--- | :---: | :--- | :--- | :--- |\n';
  for (const r of rows) {
    const idLink = r.uri ? `[${r.id}](${r.uri})` : r.id;
    const emoji = SEVERITY_EMOJI[r.severity] ?? '';
    const fix = r.fix && r.fix !== 'NotAvailable' ? r.fix : '—';
    const desc = r.description.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    table += `| ${idLink} | ${emoji} ${r.severity} | \`${r.package}\` | ${fix} | ${desc} |\n`;
  }
  return table;
}

function truncate(text: string | undefined, maxLen: number): string {
  const s = text ?? '';
  return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
}

async function getGitHubToken(secretName: string): Promise<string> {
  const result = await secretsClient.send(new GetSecretValueCommand({ SecretId: secretName }));
  const secret = result.SecretString;
  if (!secret) throw new Error('GitHub token secret is empty');
  return secret;
}

/**
 * Format a "scan passed" report for when no vulnerabilities are found.
 */
export function formatScanSuccessReport(imageUri: string): string {
  const timestamp = new Date().toISOString();
  return `## ECR image scan passed

No vulnerabilities found above the configured threshold.

| | |
| :--- | :--- |
| **Image** | \`${imageUri}\` |
---
*EcrScanOnPushCheck · ${timestamp}*
${PR_COMMENT_MARKER}`;
}

/** GitHub params for alert functions (from props.github + imageUri). */
export type GitHubAlertParams = EcrScanHandlerGitHubProps & { imageUri: string };

/**
 * Update existing PR comment if one exists (from a previous failure). Used when scan passes.
 * Does nothing if no comment with our marker exists.
 */
export async function updatePrCommentIfExists(
  params: GitHubAlertParams,
  body: string,
): Promise<void> {
  if (params.prNumber == null) return;

  const token = await getGitHubToken(params.tokenSecretName);
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
  const baseUrl = `https://api.github.com/repos/${params.owner}/${params.repo}`;
  const bodyWithMarker = body.includes(PR_COMMENT_MARKER) ? body : `${body}\n${PR_COMMENT_MARKER}`;

  const listRes = await fetch(`${baseUrl}/issues/${params.prNumber}/comments`, { headers });
  if (!listRes.ok) throw new Error(`GitHub API error (${listRes.status}): ${await listRes.text()}`);

  const comments = (await listRes.json()) as Array<{ id: number; body?: string }>;
  const existing = comments.find(c => c.body?.includes(PR_COMMENT_MARKER));

  if (existing) {
    const patchRes = await fetch(`${baseUrl}/issues/comments/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ body: bodyWithMarker }),
    });
    if (!patchRes.ok) throw new Error(`GitHub API error (${patchRes.status}): ${await patchRes.text()}`);
    console.log(`Updated PR #${params.prNumber} comment: scan passed, no vulnerabilities`);
  }
}

/**
 * Post or update GitHub alert: PR comment (update existing if found) or new issue.
 */
export async function alertGitHub(
  params: GitHubAlertParams,
  body: string,
): Promise<void> {
  const token = await getGitHubToken(params.tokenSecretName);
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
  const baseUrl = `https://api.github.com/repos/${params.owner}/${params.repo}`;
  const bodyWithMarker = body.includes(PR_COMMENT_MARKER) ? body : `${body}\n${PR_COMMENT_MARKER}`;

  if (params.prNumber != null) {
    await postOrUpdatePrComment(baseUrl, params.prNumber, bodyWithMarker, headers);
  } else {
    await createIssue(baseUrl, params.imageUri, body, headers);
  }
}

async function postOrUpdatePrComment(
  baseUrl: string,
  prNumber: number,
  body: string,
  headers: Record<string, string>,
): Promise<void> {
  const listRes = await fetch(`${baseUrl}/issues/${prNumber}/comments`, { headers });
  if (!listRes.ok) throw new Error(`GitHub API error (${listRes.status}): ${await listRes.text()}`);

  const comments = (await listRes.json()) as Array<{ id: number; body?: string }>;
  const existing = comments.find(c => c.body?.includes(PR_COMMENT_MARKER));

  if (existing) {
    const patchRes = await fetch(`${baseUrl}/issues/comments/${existing.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ body }),
    });
    if (!patchRes.ok) throw new Error(`GitHub API error (${patchRes.status}): ${await patchRes.text()}`);
    console.log(`Updated existing comment on PR #${prNumber}`);
  } else {
    const res = await fetch(`${baseUrl}/issues/${prNumber}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body }),
    });
    if (!res.ok) throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
    console.log(`Posted comment on PR #${prNumber}`);
  }
}

async function createIssue(
  baseUrl: string,
  imageUri: string,
  body: string,
  headers: Record<string, string>,
): Promise<void> {
  const title = `ECR image scan failed: vulnerabilities detected (${imageUri})`;
  const res = await fetch(`${baseUrl}/issues`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, body }),
  });
  if (!res.ok) throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
  console.log('Created GitHub issue');
}
