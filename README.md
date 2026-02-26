# cdk-ecr-scan-alert

AWS CDK construct that runs ECR image vulnerability scans during deployment and reports findings to GitHub. Blocks deployment when critical or high-severity vulnerabilities are found (configurable).

## Features

- **Scans ECR images** via `StartImageScan` and polls until completion
- **Blocks deployment** by default if vulnerabilities exceed the severity threshold
- **GitHub integration** — posts formatted reports as PR comments or creates issues
- **Configurable severity thresholds** — CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL, UNDEFINED
- **Rollback-safe** — suppresses errors during CloudFormation rollback to avoid `ROLLBACK_FAILED`

## Prerequisites

- (Optional) ECR scan on push. If not present the construct will require a scan
- (Optional) GitHub token in Secrets Manager for posting alerts

## Installation

```bash
# Using pnpm
pnpm add @condensetech/cdk-ecr-scan-alert

# Using npm
npm install @condensetech/cdk-ecr-scan-alert

# Using yarn
yarn add @condensetech/cdk-ecr-scan-alert
```

## Usage

```typescript
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { EcrScanAlert } from '@condensetech/cdk-ecr-scan-alert';

// In your stack:
const repo = ecr.Repository.fromRepositoryName(this, 'Repo', 'my-ecr-repo');

new EcrScanAlert(this, 'ScanAlert', {
  imageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/my-ecr-repo:v1.2.3',
  repository: repo,
  github: {
    owner: 'my-org',
    repo: 'my-app',
    tokenSecretName: 'github/token',
    prNumber: 42, // optional: comment on PR instead of creating an issue
  },
});
```

### Minimal (no GitHub integration)

```typescript
new EcrScanAlert(this, 'ScanAlert', {
  imageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/my-repo:latest',
  repository: repo,
});
```

## API Reference

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `imageUri` | string | Yes | — | Full ECR image URI (e.g. `account.dkr.ecr.region.amazonaws.com/repo:tag`) |
| `repository` | `IRepository` | Yes | — | ECR repository (used for IAM permissions) |
| `github` | `EcrScanAlertGitHubProps` | No | — | GitHub integration: `{ owner, repo, tokenSecretName, prNumber? }` |
| `severityThreshold` | string[] | No | `['CRITICAL', 'HIGH']` | Severities that cause failure |
| `suppressErrorOnRollback` | boolean | No | `true` | Suppress errors during rollback to avoid ROLLBACK_FAILED |
| `blockDeployment` | boolean | No | `true` | When `true`, deployment fails on findings; when `false`, deployment proceeds but GitHub alerts still post |

### `EcrScanAlertGitHubProps` (when using `github`)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `owner` | string | Yes | GitHub org or username |
| `repo` | string | Yes | GitHub repository name |
| `tokenSecretName` | string | Yes | Secrets Manager secret name containing the GitHub token |
| `prNumber` | number | No | If set, comment on this PR instead of creating an issue |

## GitHub Integration

1. Create a [GitHub fine-grained token](https://github.com/settings/tokens) or classic PAT with:
   - **Repository access**: the target repo(s)
   - **Permissions**: `Issues: Read and write`, `Pull requests: Read and write`, `Metadata: Read-only`

2. Store the token in AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name github/token \
     --secret-string "ghp_xxxx"
   ```

3. Pass the `github` prop to the construct with `owner`, `repo`, and `tokenSecretName`.

### PR vs Issue

- **With `prNumber`**: Posts/updates a single comment on the PR (ideal for CI deployments from PRs)
- **Without `prNumber`**: Creates a new GitHub issue for each failure

## License

Apache-2.0
