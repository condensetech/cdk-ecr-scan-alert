import { awscdk, javascript } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  packageName: '@condensetech/cdk-ecr-scan-alert',
  author: 'CoNDENSE.tech',
  authorAddress: 'tech@condense.tech',
  authorOrganization: true,
  license: 'MIT',
  repository: 'git@github.com:condensetech/cdk-ecr-scan-alert.git',
  cdkVersion: '2.189.1',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.9.0',
  name: 'cdk-ecr-scan-alert',
  packageManager: javascript.NodePackageManager.PNPM,
  projenrcTs: true,
  repositoryUrl: 'https://github.com/nicola.racco/cdk-ecr-scan-alert.git',
  devDeps: [
    '@aws-sdk/client-cloudformation@^3.998.0',
    '@aws-sdk/client-ecr@^3.998.0',
    '@aws-sdk/client-secrets-manager@^3.998.0',
    'esbuild@^0.27.3',
  ],
  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.package.addField('pnpm', {
  onlyBuiltDependencies: [
    'esbuild',
  ],
});
project.addGitIgnore('.pnpm-store/');
// Include lambda/ in published package
project.addPackageIgnore('!/lambda/');

project.synth();