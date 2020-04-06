import { Request, Response } from "express";
import * as validation from "spektate/lib/Validation";
import * as config from "./config";

export interface IHealth extends validation.IErrors {
  variables: ISpektateConfig;
}
export interface ISpektateConfig {
  [id: string]: string;
}

export const getKeyToDisplay = (key: string) => {
  return key.replace(/.(?=.{4})/g, "*");
};

export const get = async (req: Request, res: Response) => {
  if (config.isValuesValid(res)) {
    try {
      const status = await validation.validateConfiguration(
        config.STORAGE_ACCOUNT_NAME,
        config.STORAGE_ACCOUNT_KEY,
        config.STORAGE_TABLE_NAME,
        config.STORAGE_PARTITION_KEY,
        config.AZURE_ORG,
        config.AZURE_PROJECT,
        config.AZURE_PIPELINE_ACCESS_TOKEN,
        config.SOURCE_REPO_ACCESS_TOKEN,
        config.MANIFEST,
        config.MANIFEST_ACCESS_TOKEN,
        config.GITHUB_MANIFEST_USERNAME
      );
      const health: IHealth = {
        errors: status.errors,
        variables: {
          AZURE_ORG: config.AZURE_ORG,
          AZURE_PIPELINE_ACCESS_TOKEN:
            config.AZURE_PIPELINE_ACCESS_TOKEN !== ""
              ? getKeyToDisplay(config.AZURE_PIPELINE_ACCESS_TOKEN)
              : "",
          AZURE_PROJECT: config.AZURE_PROJECT,
          MANIFEST: config.MANIFEST,
          MANIFEST_ACCESS_TOKEN:
            config.MANIFEST_ACCESS_TOKEN !== ""
              ? getKeyToDisplay(config.MANIFEST_ACCESS_TOKEN)
              : "",
          SOURCE_REPO_ACCESS_TOKEN:
            config.SOURCE_REPO_ACCESS_TOKEN !== ""
              ? getKeyToDisplay(config.SOURCE_REPO_ACCESS_TOKEN)
              : "",
          STORAGE_ACCOUNT_KEY:
            config.STORAGE_ACCOUNT_KEY !== ""
              ? getKeyToDisplay(config.STORAGE_ACCOUNT_KEY)
              : "",
          STORAGE_ACCOUNT_NAME: config.STORAGE_ACCOUNT_NAME,
          STORAGE_PARTITION_KEY: config.STORAGE_PARTITION_KEY,
          STORAGE_TABLE_NAME: config.STORAGE_TABLE_NAME
        }
      };
      if (config.GITHUB_MANIFEST_USERNAME !== "") {
        health.variables.GITHUB_MANIFEST_USERNAME =
          config.GITHUB_MANIFEST_USERNAME;
      }
      res.json(health || {});
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
};
