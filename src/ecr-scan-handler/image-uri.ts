import type { ParsedImageUri } from './types';

/**
 * Parse ECR image URI into repository name, tag, and optional registry ID.
 * Format: 123456789012.dkr.ecr.us-west-1.amazonaws.com/repository-name:tag
 */
export function parseImageUri(imageUri: string): ParsedImageUri {
  const colonIdx = imageUri.lastIndexOf(':');
  const uri = colonIdx >= 0 ? imageUri.slice(0, colonIdx) : imageUri;
  const tag = colonIdx >= 0 ? imageUri.slice(colonIdx + 1) : 'latest';
  const slashIdx = uri.indexOf('/');
  const repositoryName = slashIdx >= 0 ? uri.slice(slashIdx + 1) : uri;
  const host = slashIdx >= 0 ? uri.slice(0, slashIdx) : uri;
  const registryId = /^\d{12}\./.test(host) ? host.slice(0, 12) : undefined;

  return {
    repositoryName,
    imageTag: tag || 'latest',
    registryId,
  };
}
