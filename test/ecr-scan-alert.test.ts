import { App, Stack } from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { EcrScanAlert, type EcrScanAlertProps, type EcrScanAlertGitHubProps } from '../src';

describe('EcrScanAlert', () => {
  it('exports construct and prop types', () => {
    expect(EcrScanAlert).toBeDefined();
    const githubProps: EcrScanAlertGitHubProps = {
      owner: 'org',
      repo: 'repo',
      tokenSecretName: 'secret',
      prNumber: 1,
    };
    const props: EcrScanAlertProps = {
      imageUri: '123.dkr.ecr.us-east-1.amazonaws.com/repo:tag',
      repository: {} as ecr.IRepository,
      github: githubProps,
    };
    expect(props.imageUri).toBe('123.dkr.ecr.us-east-1.amazonaws.com/repo:tag');
    expect(props.github?.owner).toBe('org');
  });

  // Synthesis tests require Docker for Lambda bundling; skip when unavailable
  const skipSynthTests = process.env.SKIP_SYNTH_TESTS === '1';

  (skipSynthTests ? it.skip : it)('synthesizes without error', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    const repo = ecr.Repository.fromRepositoryName(stack, 'Repo', 'test-repo');
    new EcrScanAlert(stack, 'ScanAlert', {
      imageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/test-repo:latest',
      repository: repo,
    });
    expect(() => app.synth()).not.toThrow();
  });

  (skipSynthTests ? it.skip : it)('synthesizes with github config', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    const repo = ecr.Repository.fromRepositoryName(stack, 'Repo', 'test-repo');
    new EcrScanAlert(stack, 'ScanAlert', {
      imageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/test-repo:v1',
      repository: repo,
      github: {
        owner: 'my-org',
        repo: 'my-repo',
        tokenSecretName: 'github/token',
        prNumber: 123,
      },
    });
    expect(() => app.synth()).not.toThrow();
  });

  (skipSynthTests ? it.skip : it)('includes CustomResource with correct type', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    const repo = ecr.Repository.fromRepositoryName(stack, 'Repo', 'test-repo');
    new EcrScanAlert(stack, 'ScanAlert', {
      imageUri: '123.dkr.ecr.us-east-1.amazonaws.com/repo:tag',
      repository: repo,
    });
    const assembly = app.synth();
    const stackArtifact = assembly.getStackByName(stack.stackName);
    const template = stackArtifact.template as Record<string, unknown>;
    const resources = (template.Resources as Record<string, { Type?: string; Properties?: Record<string, unknown> }>) ?? {};
    const customResources = Object.values(resources).filter((r) => r?.Type === 'Custom::EcrScanAlert');
    expect(customResources).toHaveLength(1);
    expect((customResources[0] as { Properties?: { imageUri?: string } }).Properties?.imageUri).toBe(
      '123.dkr.ecr.us-east-1.amazonaws.com/repo:tag',
    );
  });
});
