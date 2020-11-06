import { Request, Response } from "express";
import * as validation from "spektate/lib/Validation";
import { getConfig, IAzDOPipelineConfig, IAzDORepoConfig } from "./config";

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
      (config.pipelineConfig as IAzDOPipelineConfig).org ?? "",
      (config.pipelineConfig as IAzDOPipelineConfig).project ?? "",
      (config.pipelineConfig as IAzDOPipelineConfig).accessToken ?? "",
      (config.pipelineConfig as IAzDOPipelineConfig).accessToken ?? "",
      (config.repoConfig as IAzDORepoConfig).manifestRepo,
      (config.repoConfig as IAzDORepoConfig).accessToken ?? ""
    );
    const health: IHealth = {
      errors: status.errors,
      variables: {
        AZURE_ORG: (config.pipelineConfig as IAzDOPipelineConfig).org ?? "",
        AZURE_PIPELINE_ACCESS_TOKEN: getKeyToDisplay(
          (config.pipelineConfig as IAzDOPipelineConfig).accessToken ?? ""
        ),
        AZURE_PROJECT:
          (config.pipelineConfig as IAzDOPipelineConfig).project ?? "",
        MANIFEST: (config.repoConfig as IAzDORepoConfig).manifestRepo,
        MANIFEST_ACCESS_TOKEN: getKeyToDisplay(
          (config.pipelineConfig as IAzDOPipelineConfig).accessToken ?? ""
        ),
        SOURCE_REPO_ACCESS_TOKEN: getKeyToDisplay(
          (config.repoConfig as IAzDORepoConfig).accessToken ?? ""
        ),
        STORAGE_ACCOUNT_KEY: getKeyToDisplay(config.storageAccessKey),
        STORAGE_ACCOUNT_NAME: config.storageAccountName,
        STORAGE_PARTITION_KEY: config.storagePartitionKey,
        STORAGE_TABLE_NAME: config.storageTableName,
      },
    };
    res.json(health || {});
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};
