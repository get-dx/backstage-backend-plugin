# DX Backstage Backend Plugin

DX Backstage plugin to automatically sync your Backstage data to DX Data Cloud.

## Setup

> v2 of this plugin supports the [new backend system](https://backstage.io/docs/backend-system/) first, and deprecates support for the old backend system which will be removed in a future.

1. Install this plugin in your backstage backend —

```bash
yarn add @get-dx/backstage-backend-plugin
```

2. Configure a proxy endpoint with the DX host and token found at https://app.getdx.com/datacloud/api_keys —

```yaml
# app-config.yaml
proxy:
  endpoints:
    "/dx":
      target: ${DX_API_HOST_URL}
      headers:
        Authorization: Bearer ${DX_API_TOKEN}
```

3. In your `packages/backend/src/index.ts` file, make the following changes:

```diff
  import { createBackend } from '@backstage/backend-defaults';

  const backend = createBackend();

  // ... other feature additions

+ backend.add(import('@get-dx/backstage-backend-plugin'));

  backend.start();
```

5. Deploy your backend!

## Configuration

### Entity Filter

Optionally set `catalogSyncAllowedKinds` to only send specific kinds of entities to DX.

```yaml
# app-config.yaml
dx:
  catalogSyncAllowedKinds: [API, Component, User, Group]
```

### Schedule

You may optionally configure a schedule for the task that matches a [`TaskScheduleDefinition`](https://backstage.io/docs/reference/backend-tasks.taskscheduledefinition/#properties),
only each key is optional —

```yaml
# app-config.yaml
dx:
  schedule:
    frequency:
      minutes: 45
```

The default schedule in [`TaskScheduleDefinition`](https://backstage.io/docs/reference/backend-tasks.taskscheduledefinition/#properties) format is —

| Property       | Value            |
| -------------- | ---------------- |
| `frequency`    | `{ hours: 1 }`   |
| `timeout`      | `{ minutes: 2 }` |
| `initialDelay` | `{ seconds: 3 }` |
| `scope`        | `'global'`       |

### Application Id

Optionally set `appId` to distinguish multiple instances of backstage within DX. Can be any string as long as it's unique within your DX account.

```yaml
# app-config.yaml
dx:
  appId: staging
```

### Disable Catalog Sync

Optionally set `disableCatalogSync` to disable running the software catalog sync scheduled task.

This can be helpful for local development or when running multiple environments of backstage, such as dev, staging, prod.

```yaml
# app-config.yaml
dx:
  disableCatalogSync: true
```
