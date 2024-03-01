export interface Config {
  /** Configuration options for the DX plugin */
  dx?: {
    /**
     * Optional 'appId' attribute used by DX to differentiate Backstage applications.
     * Most useful when you have multiple Backstage applications.
     * If not provided, it will be set by DX.
     *
     * @visibility frontend
     */
    appId?: string;
    /**
     * Optionally disable the catalog sync to DX.data collection.
     * Useful to disable collection in development environments with configuration overrides.
     *
     * @visibility backend
     */
    disableCatalogSync?: boolean;
  };
}
