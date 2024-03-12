# DX Backstage Backend Plugin

⚠️ BETA - This plugin is in a closed beta right now. Functionality and API of this plugin is certain to change. Please reach out to DX if you are interested! developers@getdx.com

DX Backstage plugin to automatically sync your Backstage data to DX Data Cloud.

## Setup

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

3. Add a new plugin file at `packages/backend/src/plugins/dx.ts` —

```ts
import { PluginEnvironment } from "../types";
import { createRouter } from "@get-dx/backstage-backend-plugin";

export default async function createPlugin(env: PluginEnvironment) {
  return await createRouter({
    scheduler: env.scheduler,
    logger: env.logger,
    discovery: env.discovery,
    config: env.config,
  });
}
```

4. Update your backend startup to include the DX plugin —

```ts
import dx from "./plugins/dx";
// ...
const dxEnv = useHotMemoize(module, () => createEnv("dx"));
// ...
apiRouter.use("/dx", await dx(dxEnv));
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

You may optionally pass a schedule for the task that matches a [`TaskScheduleDefinition`](https://backstage.io/docs/reference/backend-tasks.taskscheduledefinition/#properties).
Only each key is optional —

```ts
return await createRouter({
  ...env,
  schedule: {
    frequency: { minutes: 30 },
    timeout: { seconds: 90 },
  },
});
```

The default schedule in [`TaskScheduleDefinition`](https://backstage.io/docs/reference/backend-tasks.taskscheduledefinition/#properties) format is —

| Property       | Value            |
| -------------- | ---------------- |
| `frequency`    | `{ hours: 1 }`   |
| `timeout`      | `{ minutes: 2 }` |
| `initialDelay` | `{ seconds: 3 }` |
| `scope`        | `'global'`       |

### Service to Service Auth

If you are using backstage [service to service auth](https://backstage.io/docs/auth/service-to-service-auth) you can pass a `tokenManager` to the plugin to authenticate requests from the plugin to your Catalog and Proxy API.

```ts
export default async function createPlugin(env: PluginEnvironment) {
  return await createRouter({
    ...
    tokenManager: env.tokenManager,
  });
}
```

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
