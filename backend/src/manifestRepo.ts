import { Request, Response } from "express";
import { AzureDevOpsRepo } from "spektate/lib/repository/AzureDevOpsRepo";
import { GitHub } from "spektate/lib/repository/GitHub";
import { ITag } from "spektate/lib/repository/Tag";
import * as config from "./config";

const getManifestRepoSyncState = (): Promise<ITag[]> => {
  let manifestRepo: AzureDevOpsRepo | GitHub | undefined;

  if (
    config.MANIFEST &&
    config.GITHUB_MANIFEST_USERNAME &&
    config.GITHUB_MANIFEST_USERNAME !== ""
  ) {
    manifestRepo = new GitHub(config.GITHUB_MANIFEST_USERNAME, config.MANIFEST);
  } else if (config.MANIFEST) {
    manifestRepo = new AzureDevOpsRepo(
      config.AZURE_ORG,
      config.AZURE_PROJECT,
      config.MANIFEST
    );
  }

  return new Promise((resolve, reject) => {
    if (manifestRepo) {
      manifestRepo
        .getManifestSyncState(config.MANIFEST_ACCESS_TOKEN)
        .then(syncCommits => {
          resolve(syncCommits);
        })
        .catch(err => {
          console.log(err);
          reject(undefined);
        });
    }
  });
};

export const get = async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  if (config.isValuesValid()) {
    const status = await getManifestRepoSyncState();
    res.json(status || {});
  } else {
    res
      .status(500)
      .send(
        "Environment variables need to be exported for Spektate configuration"
      );
  }
};
