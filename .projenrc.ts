import { awscdk, javascript } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Nicola Racco',
  authorAddress: 'nicola.racco@gmail.com',
  cdkVersion: '2.189.1',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.9.0',
  name: 'cdk-ecr-scan-alert',
  packageManager: javascript.NodePackageManager.PNPM,
  projenrcTs: true,
  repositoryUrl: 'https://github.com/nicola.racco/cdk-ecr-scan-alert.git',

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();