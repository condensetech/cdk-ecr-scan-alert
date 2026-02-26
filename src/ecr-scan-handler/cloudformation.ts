import {
  CloudFormationClient,
  DescribeStacksCommand,
  ResourceStatus,
} from '@aws-sdk/client-cloudformation';

const client = new CloudFormationClient();

/**
 * Check if the given stack is currently rolling back.
 * Used to suppress errors during CloudFormation rollback to avoid ROLLBACK_FAILED.
 */
export async function isRollbackInProgress(stackId: string): Promise<boolean> {
  const response = await client.send(new DescribeStacksCommand({ StackName: stackId }));
  if (!response.Stacks?.length) throw new Error(`Stack not found: ${stackId}`);

  const status = response.Stacks[0].StackStatus;
  return (
    status === ResourceStatus.ROLLBACK_IN_PROGRESS ||
    status === ResourceStatus.UPDATE_ROLLBACK_IN_PROGRESS
  );
}
