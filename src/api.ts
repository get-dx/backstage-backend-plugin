import {
  PluginEndpointDiscovery,
  TokenManager,
} from "@backstage/backend-common";
import { Entity } from "@backstage/catalog-model";
import { JsonObject } from "@backstage/types";
import fetch from "node-fetch";

import { chunk } from "./utils";
import { Config } from "@backstage/config";

const CHUNK_SIZE = 100;

interface Options {
  entities: Entity[];
  discovery: PluginEndpointDiscovery;
  config: Config;
  tokenManager?: TokenManager;
}

export async function catalogSync({
  entities,
  discovery,
  config,
  tokenManager,
}: Options) {
  const baseUrl = await getBaseUrl(discovery);

  const application = {
    id: config.getOptionalString("dx.appId"),
    title: config.getOptionalString("app.title"),
    baseUrl: config.getOptionalString("app.baseUrl"),
  };

  // Notify DX of sync start
  await post(
    `${baseUrl}/api/backstage.catalogSyncStart`,
    { application },
    tokenManager,
  );

  // Chunk all entities
  for (const entityChunk of chunk(entities, CHUNK_SIZE)) {
    await post(
      `${baseUrl}/api/backstage.catalogSyncChunk`,
      {
        application,
        entities: entityChunk,
      },
      tokenManager,
    );
  }

  // Notify DX of sync complete
  await post(
    `${baseUrl}/api/backstage.catalogSyncComplete`,
    { application },
    tokenManager,
  );
}

// Future - Include a version header so we know what type of body structure to expect.
async function post(
  path: string,
  reqBody: JsonObject,
  tokenManager?: TokenManager,
) {
  const headers: HeadersInit = {};

  if (tokenManager) {
    const token = await tokenManager.getToken();
    headers.Authorization = `Bearer ${token.token}`;
  }

  const res = await fetch(path, {
    method: "POST",
    body: JSON.stringify(reqBody),
    headers: { "Content-Type": "application/json", ...headers },
  });

  const resBody = await res.json();

  // DX specific error
  if (resBody.ok === false) {
    throw new Error(`Error communicating with DX: ${resBody.error}`);
  }

  // Other unknown error
  if (!res.ok) {
    throw new Error(`Error communicating with DX: ${JSON.stringify(resBody)}`);
  }

  return resBody;
}

async function getBaseUrl(discovery: PluginEndpointDiscovery) {
  const proxyBaseUrl = await discovery.getBaseUrl("proxy");
  return `${proxyBaseUrl}/dx`;
}
