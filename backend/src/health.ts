import { Request, Response } from "express";
import * as validation from "spektate/lib/Validation";
import { getConfig } from "./config";

export interface IHealth extends validation.IErrors {
  variables: ISpektateConfig;
}

export interface ISpektateConfig {
  [id: string]: string;
}

/**
 * Masks secrets with * and returns displayable string
 * @param key
 */
export const getKeyToDisplay = (key: string): string => {
  return key ? key.replace(/.(?=.{4})/g, "*") : "";
};

/**
 * Express get function for health
 * @param req Request obj
 * @param res Response obj
 */
export const get = async (req: Request, res: Response) => {
  const config = getConfig();
  try {
    const status = await validation.validateConfiguration(
      config.storageAccountName,
      config.storageAccessKey,
      config.storageTableName,
      config.storagePartitionKey,
      config.org ?? "",
      config.project ?? "",
      config.pipelineAccessToken,
      config.sourceRepoAccessToken,
      config.manifestRepoName,
      config.manifestAccessToken,
      config.githubManifestUsername
    );
    const health: IHealth = {
      errors: status.errors,
      variables: {
        AZURE_ORG: config.org ?? "",
        AZURE_PIPELINE_ACCESS_TOKEN: getKeyToDisplay(
          config.pipelineAccessToken
        ),
        AZURE_PROJECT: config.project ?? "",
        MANIFEST: config.manifestRepoName,
        MANIFEST_ACCESS_TOKEN: getKeyToDisplay(config.manifestAccessToken),
        SOURCE_REPO_ACCESS_TOKEN: getKeyToDisplay(config.sourceRepoAccessToken),
        STORAGE_ACCOUNT_KEY: getKeyToDisplay(config.storageAccessKey),
        STORAGE_ACCOUNT_NAME: config.storageAccountName,
        STORAGE_PARTITION_KEY: config.storagePartitionKey,
        STORAGE_TABLE_NAME: config.storageTableName,
      },
    };
    if (config.githubManifestUsername !== "") {
      health.variables.GITHUB_MANIFEST_USERNAME =
        config.githubManifestUsername ?? "";
    }
    res.json(health || {});
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};
