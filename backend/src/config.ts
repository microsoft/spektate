import { Response } from "express";

export interface IConfig {
  org: string;
  project: string;
  pipelineAccessToken: string;
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
  };
};

export const cacheRefreshInterval = (): number => {
  const interval = process.env.REACT_APP_CACHE_REFRESH_INTERVAL_IN_SEC || "30";
  try {
    const val = parseInt(interval, 10);
    return val * 1000;
  } catch (err) {
    console.log("REACT_APP_CACHE_REFRESH_INTERVAL_IN_SEC is not a number");
    // default to 30 seconds
    return 30 * 1000;
  }
};

export const isConfigValid = (res?: Response) => {
  const config = getConfig();
  if (
    !!config.org &&
    !!config.project &&
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
