import { PluginEndpointDiscovery } from "@backstage/backend-common";
import { Entity } from "@backstage/catalog-model";
import fetch from "node-fetch";

import { chunk } from "./utils";
import { Config } from "@backstage/config";

const CHUNK_SIZE = 1000;

interface Options {
  entities: Entity[];
  discovery: PluginEndpointDiscovery;
  config: Config;
}

export async function ingest({ entities, discovery, config }: Options) {
  const baseUrl = await getBaseUrl(discovery);

  const application = {
    id: config.getOptionalString("dx.appId"),
    title: config.getOptionalString("app.title"),
    baseUrl: config.getOptionalString("app.baseUrl"),
  };

  for (const entityChunk of chunk(entities, CHUNK_SIZE)) {
    await post(`${baseUrl}/api/backstageCatalog.ingest`, {
      application,
      entities: entityChunk,
    });
  }
}

// TODO: Include a version header so we know what type of body structure to expect?
function post(path: string, body: Record<string, any>) {
  return fetch(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

async function getBaseUrl(discovery: PluginEndpointDiscovery) {
  const proxyBaseUrl = await discovery.getBaseUrl("proxy");
  return `${proxyBaseUrl}/dx`;
}
