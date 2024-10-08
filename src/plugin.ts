import express from "express";
import Router from "express-promise-router";
import {
  createBackendPlugin,
  coreServices,
  LoggerService,
  SchedulerService,
  AuthService,
  SchedulerServiceTaskScheduleDefinition,
} from "@backstage/backend-plugin-api";
import {
  CatalogClient,
  CatalogRequestOptions,
  EntityFilterQuery,
} from "@backstage/catalog-client";
import { PluginEndpointDiscovery } from "@backstage/backend-common";
import { Config } from "@backstage/config";
import { catalogSync } from "./api";

export const dxBackendPlugin = createBackendPlugin({
  pluginId: "get-dx-backstage-backend-plugin",
  register(env) {
    env.registerInit({
      deps: {
        // Declare dependencies to services that you want to consume
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        discovery: coreServices.discovery,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
        http: coreServices.httpRouter,
      },
      async init({
        // Requested service instances get injected as per above
        logger,
        scheduler,
        discovery,
        config,
        auth,
        http,
      }) {
        http.use(
          await createRouter({
            logger,
            scheduler,
            discovery,
            config,
            auth,
          }),
        );
      },
    });
  },
});

/*
 * @public
 * @deprecated Please migrate to the new backend system.
 * */
export interface Options {
  logger: LoggerService;
  scheduler: SchedulerService;
  discovery: PluginEndpointDiscovery;
  config: Config;
  auth?: AuthService;
}

/*
 * @public
 * @deprecated Please migrate to the new backend system.
 * */
export async function createRouter(options: Options): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get("/health", (_, response) => {
    response.send({ status: "ok" });
  });

  await scheduleTask(options);

  return router;
}

function scheduleTask({ logger, scheduler, discovery, config, auth }: Options) {
  const schedule = config.getOptional(
    "dx.schedule",
  ) as Partial<SchedulerServiceTaskScheduleDefinition>;

  return scheduler.scheduleTask({
    id: "dx-catalog-sync",
    frequency: schedule?.frequency ?? { hours: 1 },
    timeout: schedule?.timeout ?? { minutes: 2 },
    // A 3 second delay gives the backend server a chance to initialize before
    // any collators are executed, which may attempt requests against the API.
    initialDelay: schedule?.initialDelay ?? { seconds: 3 },
    scope: schedule?.scope ?? "global",
    fn: async () => {
      const isDisabled = config.getOptionalBoolean("dx.disableCatalogSync");

      if (isDisabled) {
        logger.info("DX Catalog sync is disabled, skipping.");
        return;
      }

      logger.info("Starting DX Catalog sync");

      const catalogApi = new CatalogClient({ discoveryApi: discovery });

      const opts: CatalogRequestOptions = {};

      try {
        if (auth) {
          const { token } = await auth.getPluginRequestToken({
            onBehalfOf: await auth.getOwnServiceCredentials(),
            targetPluginId: "catalog",
          });
          opts.token = token;
        }

        let filter: EntityFilterQuery = {};

        const allowedKinds = config.getOptionalStringArray(
          "dx.catalogSyncAllowedKinds",
        );

        if (allowedKinds) {
          filter = { kind: allowedKinds };
        }

        const { items: entities } = await catalogApi.getEntities(
          { filter },
          opts,
        );

        await catalogSync({ entities, discovery, config, auth });
      } catch (error) {
        logger.error(`Error during DX Catalog sync: ${getErrorMessage(error)}`);
      }

      logger.info("Finished DX Catalog sync");
    },
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}
