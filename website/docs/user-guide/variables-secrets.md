---
sidebar_position: 5
title: Variables & Secrets
---

# Variables & Secrets

Teckel Editor supports pipeline variables and secrets that are passed to the Teckel Engine during validation and execution.

## Variables

Open the **Variables** panel to define key-value pairs. Variables use the `${VAR_NAME}` syntax in pipeline YAML:

```yaml
input:
  - name: events
    format: parquet
    path: ${INPUT_PATH}/events/
```

### Defining variables

In the Variables panel:

1. Click **Add Variable**
2. Enter the variable name (e.g., `INPUT_PATH`)
3. Enter the value (e.g., `s3://my-bucket/data`)

Variables are sent as a `Record<string, string>` map to the server on every `ValidatePipeline`, `ExplainPipeline`, and `SubmitJob` call.

## Secrets

Secrets are sensitive values that are declared with an alias, key, and scope. They are referenced in YAML using the `{{secrets.alias}}` syntax:

```yaml
input:
  - name: db_source
    format: jdbc
    path: jdbc:postgresql://host/db
    options:
      password: "{{secrets.db_password}}"
```

### Declaring secrets

Secrets are defined in the `secrets` section of the pipeline YAML. The editor preserves this section during round-trip:

```yaml
secrets:
  db_password:
    key: DB_PASSWORD
    scope: environment
```

The `scope` determines where the secret value is resolved at runtime (e.g., environment variables, a secrets manager).

## How they are passed

When the editor calls any gRPC method that requires pipeline context, both variables and secrets are included:

```typescript
// Variables are passed explicitly
await client.validate(yaml, variables);
await client.submitJob(yaml, variables);

// Secrets are embedded in the YAML itself
// and resolved by the engine at runtime
```

Variables are resolved at validation time, allowing the server to check that all references are valid. Secrets are not resolved until execution, keeping sensitive values out of the editor.
