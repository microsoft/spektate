import { Request, Response } from "express";
import * as validation from "spektate/lib/Validation";
import * as config from "./config";

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
      res.json(status || {});
    } catch (err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
};
