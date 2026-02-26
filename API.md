# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### EcrScanAlert <a name="EcrScanAlert" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert"></a>

#### Initializers <a name="Initializers" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.Initializer"></a>

```typescript
import { EcrScanAlert } from '@condensetech/cdk-ecr-scan-alert'

new EcrScanAlert(scope: Construct, id: string, props: EcrScanAlertProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlert.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlert.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlert.Initializer.parameter.props">props</a></code> | <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps">EcrScanAlertProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.Initializer.parameter.props"></a>

- *Type:* <a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps">EcrScanAlertProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlert.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlert.with">with</a></code> | Applies one or more mixins to this construct. |

---

##### `toString` <a name="toString" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `with` <a name="with" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.with"></a>

```typescript
public with(mixins: ...IMixin[]): IConstruct
```

Applies one or more mixins to this construct.

Mixins are applied in order. The list of constructs is captured at the
start of the call, so constructs added by a mixin will not be visited.
Use multiple `with()` calls if subsequent mixins should apply to added
constructs.

###### `mixins`<sup>Required</sup> <a name="mixins" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.with.parameter.mixins"></a>

- *Type:* ...constructs.IMixin[]

The mixins to apply.

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlert.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |

---

##### `isConstruct` <a name="isConstruct" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.isConstruct"></a>

```typescript
import { EcrScanAlert } from '@condensetech/cdk-ecr-scan-alert'

EcrScanAlert.isConstruct(x: any)
```

Checks if `x` is a construct.

Use this method instead of `instanceof` to properly detect `Construct`
instances, even when the construct library is symlinked.

Explanation: in JavaScript, multiple copies of the `constructs` library on
disk are seen as independent, completely different libraries. As a
consequence, the class `Construct` in each copy of the `constructs` library
is seen as a different class, and an instance of one class will not test as
`instanceof` the other class. `npm install` will not create installations
like this, but users may manually symlink construct libraries together or
use a monorepo tool: in those cases, multiple copies of the `constructs`
library can be accidentally installed, and `instanceof` will behave
unpredictably. It is safest to avoid using `instanceof`, and using
this type-testing method instead.

###### `x`<sup>Required</sup> <a name="x" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlert.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |

---

##### `node`<sup>Required</sup> <a name="node" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlert.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---


## Structs <a name="Structs" id="Structs"></a>

### EcrScanAlertGitHubProps <a name="EcrScanAlertGitHubProps" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps"></a>

GitHub integration configuration for posting scan results.

#### Initializer <a name="Initializer" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps.Initializer"></a>

```typescript
import { EcrScanAlertGitHubProps } from '@condensetech/cdk-ecr-scan-alert'

const ecrScanAlertGitHubProps: EcrScanAlertGitHubProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps.property.owner">owner</a></code> | <code>string</code> | GitHub owner (org or user). |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps.property.repo">repo</a></code> | <code>string</code> | GitHub repository name. |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps.property.tokenSecretName">tokenSecretName</a></code> | <code>string</code> | Name of Secrets Manager secret containing the GitHub token. |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps.property.prNumber">prNumber</a></code> | <code>number</code> | If set, comment on this PR instead of creating an issue. |

---

##### `owner`<sup>Required</sup> <a name="owner" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps.property.owner"></a>

```typescript
public readonly owner: string;
```

- *Type:* string

GitHub owner (org or user).

---

##### `repo`<sup>Required</sup> <a name="repo" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps.property.repo"></a>

```typescript
public readonly repo: string;
```

- *Type:* string

GitHub repository name.

---

##### `tokenSecretName`<sup>Required</sup> <a name="tokenSecretName" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps.property.tokenSecretName"></a>

```typescript
public readonly tokenSecretName: string;
```

- *Type:* string

Name of Secrets Manager secret containing the GitHub token.

---

##### `prNumber`<sup>Optional</sup> <a name="prNumber" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps.property.prNumber"></a>

```typescript
public readonly prNumber: number;
```

- *Type:* number

If set, comment on this PR instead of creating an issue.

---

### EcrScanAlertProps <a name="EcrScanAlertProps" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps"></a>

#### Initializer <a name="Initializer" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.Initializer"></a>

```typescript
import { EcrScanAlertProps } from '@condensetech/cdk-ecr-scan-alert'

const ecrScanAlertProps: EcrScanAlertProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.imageUri">imageUri</a></code> | <code>string</code> | ECR image URI in the repository where scan-on-push runs (destination repo + tag). |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.repository">repository</a></code> | <code>aws-cdk-lib.aws_ecr.IRepository</code> | ECR repository containing the image (where scan runs). |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.blockDeployment">blockDeployment</a></code> | <code>boolean</code> | When true, deployment fails if vulnerabilities above severity threshold are found. |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.github">github</a></code> | <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps">EcrScanAlertGitHubProps</a></code> | GitHub integration for posting scan results. |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.severityThreshold">severityThreshold</a></code> | <code>string[]</code> | Severities that cause failure. |
| <code><a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.suppressErrorOnRollback">suppressErrorOnRollback</a></code> | <code>boolean</code> | Suppress errors during CloudFormation rollback to avoid ROLLBACK_FAILED. |

---

##### `imageUri`<sup>Required</sup> <a name="imageUri" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.imageUri"></a>

```typescript
public readonly imageUri: string;
```

- *Type:* string

ECR image URI in the repository where scan-on-push runs (destination repo + tag).

---

##### `repository`<sup>Required</sup> <a name="repository" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.repository"></a>

```typescript
public readonly repository: IRepository;
```

- *Type:* aws-cdk-lib.aws_ecr.IRepository

ECR repository containing the image (where scan runs).

Used for IAM.

---

##### `blockDeployment`<sup>Optional</sup> <a name="blockDeployment" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.blockDeployment"></a>

```typescript
public readonly blockDeployment: boolean;
```

- *Type:* boolean
- *Default:* true

When true, deployment fails if vulnerabilities above severity threshold are found.

When false, deployment proceeds but GitHub comments are still posted.

---

##### `github`<sup>Optional</sup> <a name="github" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.github"></a>

```typescript
public readonly github: EcrScanAlertGitHubProps;
```

- *Type:* <a href="#@condensetech/cdk-ecr-scan-alert.EcrScanAlertGitHubProps">EcrScanAlertGitHubProps</a>

GitHub integration for posting scan results.

When omitted, no GitHub alerts are posted.

---

##### `severityThreshold`<sup>Optional</sup> <a name="severityThreshold" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.severityThreshold"></a>

```typescript
public readonly severityThreshold: string[];
```

- *Type:* string[]
- *Default:* ['CRITICAL', 'HIGH']

Severities that cause failure.

Comma-separated: CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL, UNDEFINED.

---

##### `suppressErrorOnRollback`<sup>Optional</sup> <a name="suppressErrorOnRollback" id="@condensetech/cdk-ecr-scan-alert.EcrScanAlertProps.property.suppressErrorOnRollback"></a>

```typescript
public readonly suppressErrorOnRollback: boolean;
```

- *Type:* boolean
- *Default:* true

Suppress errors during CloudFormation rollback to avoid ROLLBACK_FAILED.

---



