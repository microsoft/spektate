import { Response } from "express";

/**
 * Config interface
 */
export interface IConfig {
  // AzDO pipeline
  org: string;
  project: string;
  pipelineAccessToken: string;

  // Github actions
  sourceRepo: string;
  hldRepo: string;

  githubManifestUsername: string;
  manifestRepoName: string;
  manifestAccessToken: string;
  sourceRepoAccessToken: string;
  storageAccessKey: string;
  storageAccountName: string;
  storageTableName: string;
  storagePartitionKey: string;
  dockerVersion: string;
}

/**
 * Gets config
 */
export const getConfig = (): IConfig => {
  return {
    dockerVersion: process.env.REACT_APP_DOCKER_VERSION || "",
    githubManifestUsername:
      process.env.REACT_APP_GITHUB_MANIFEST_USERNAME || "",
    manifestAccessToken: process.env.REACT_APP_MANIFEST_ACCESS_TOKEN || "",
    manifestRepoName: process.env.REACT_APP_MANIFEST || "",
    org: process.env.REACT_APP_PIPELINE_ORG || "",
    pipelineAccessToken: process.env.REACT_APP_PIPELINE_ACCESS_TOKEN || "",
    project: process.env.REACT_APP_PIPELINE_PROJECT || "",
    sourceRepoAccessToken: process.env.REACT_APP_SOURCE_REPO_ACCESS_TOKEN || "",
    storageAccessKey: process.env.REACT_APP_STORAGE_ACCESS_KEY || "",
    storageAccountName: process.env.REACT_APP_STORAGE_ACCOUNT_NAME || "",
    storagePartitionKey: process.env.REACT_APP_STORAGE_PARTITION_KEY || "",
    storageTableName: process.env.REACT_APP_STORAGE_TABLE_NAME || "",
    sourceRepo: process.env.REACT_APP_SOURCE_REPO || "",
    hldRepo: process.env.REACT_APP_HLD_REPO || "",
  };
};

/**
 * Gets cache refresh interval
 */
export const cacheRefreshInterval = (): number => {
  const interval = process.env.REACT_APP_CACHE_REFRESH_INTERVAL_IN_SEC || "30";
  const val = parseInt(interval, 10);
  return isNaN(val) ? 30 * 1000 : val * 1000;
};

/**
 * Checks whether config is valid or not
 * @param res Response obj
 */
export const isConfigValid = (res?: Response) => {
  const config = getConfig();
  if (
    ((config.org && config.project) || (config.pipelineAccessToken && config.sourceRepo && config.hldRepo)) &&
    !!config.storageAccountName &&
    !!config.storageAccessKey &&
    !!config.storageTableName &&
    !!config.storagePartitionKey
  ) {
    return true;
  }

  if (res) {
    res
      .status(500)
      .send(
        "Environment variables need to be exported for Spektate configuration"
      );
  }
  return false;
};
