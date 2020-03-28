import { Response } from "express";

export const AZURE_ORG: string = process.env.REACT_APP_PIPELINE_ORG || "";
export const AZURE_PIPELINE_ACCESS_TOKEN: string =
  process.env.REACT_APP_PIPELINE_ACCESS_TOKEN || "";
export const AZURE_PROJECT: string =
  process.env.REACT_APP_PIPELINE_PROJECT || "";
export const GITHUB_MANIFEST_USERNAME: string =
  process.env.REACT_APP_GITHUB_MANIFEST_USERNAME || "";
export const MANIFEST: string = process.env.REACT_APP_MANIFEST || "";
export const MANIFEST_ACCESS_TOKEN: string =
  process.env.REACT_APP_MANIFEST_ACCESS_TOKEN || "";
export const SOURCE_REPO_ACCESS_TOKEN: string =
  process.env.REACT_APP_SOURCE_REPO_ACCESS_TOKEN || "";
export const STORAGE_ACCOUNT_KEY: string =
  process.env.REACT_APP_STORAGE_ACCESS_KEY || "";
export const STORAGE_ACCOUNT_NAME: string =
  process.env.REACT_APP_STORAGE_ACCOUNT_NAME || "";
export const STORAGE_PARTITION_KEY: string =
  process.env.REACT_APP_STORAGE_PARTITION_KEY || "";
export const STORAGE_TABLE_NAME: string =
  process.env.REACT_APP_STORAGE_TABLE_NAME || "";

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

export const isValuesValid = (res?: Response) => {
  if (
    !!AZURE_ORG &&
    !!AZURE_PROJECT &&
    !!STORAGE_ACCOUNT_NAME &&
    !!STORAGE_ACCOUNT_KEY &&
    !!STORAGE_TABLE_NAME &&
    !!STORAGE_PARTITION_KEY
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
