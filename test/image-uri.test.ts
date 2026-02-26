import { parseImageUri } from '../lambda/ecr-scan-handler/image-uri';

describe('parseImageUri', () => {
  it('parses full ECR URI with tag', () => {
    const uri = '123456789012.dkr.ecr.us-west-1.amazonaws.com/my-repo:v1.2.3';
    expect(parseImageUri(uri)).toEqual({
      repositoryName: 'my-repo',
      imageTag: 'v1.2.3',
      registryId: '123456789012',
    });
  });

  it('parses ECR URI without tag (defaults to latest)', () => {
    const uri = '123456789012.dkr.ecr.us-east-1.amazonaws.com/my-repo';
    expect(parseImageUri(uri)).toEqual({
      repositoryName: 'my-repo',
      imageTag: 'latest',
      registryId: '123456789012',
    });
  });

  it('parses URI with multiple colons (uses last colon as tag separator)', () => {
    const uri = '123456789012.dkr.ecr.eu-west-1.amazonaws.com/repo:sha256:abc123';
    expect(parseImageUri(uri)).toEqual({
      repositoryName: 'repo:sha256',
      imageTag: 'abc123',
      registryId: '123456789012',
    });
  });

  it('parses URI with registry ID (12 digits)', () => {
    const uri = '999999999999.dkr.ecr.ap-southeast-1.amazonaws.com/other-repo:latest';
    expect(parseImageUri(uri)).toEqual({
      repositoryName: 'other-repo',
      imageTag: 'latest',
      registryId: '999999999999',
    });
  });

  it('returns undefined registryId when host does not match 12-digit pattern', () => {
    const uri = 'public.ecr.aws/abc/my-image:tag';
    expect(parseImageUri(uri)).toEqual({
      repositoryName: 'abc/my-image',
      imageTag: 'tag',
      registryId: undefined,
    });
  });

  it('handles empty tag after colon', () => {
    const uri = '123456789012.dkr.ecr.us-east-1.amazonaws.com/repo:';
    expect(parseImageUri(uri)).toEqual({
      repositoryName: 'repo',
      imageTag: 'latest',
      registryId: '123456789012',
    });
  });
});
