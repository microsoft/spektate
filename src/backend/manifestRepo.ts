import { Request, Response } from "express";
import { AzureDevOpsRepo } from "spektate/lib/repository/AzureDevOpsRepo";
import { GitHub } from "spektate/lib/repository/GitHub";
import { ITag } from "spektate/lib/repository/Tag";
import * as config from "./config";

const getManifestRepoSyncState = (): Promise<ITag[]> => {
  let manifestRepo: AzureDevOpsRepo | GitHub | undefined;

  if (config.MANIFEST && config.GITHUB_MANIFEST_USERNAME) {
    manifestRepo = new GitHub(
      config.GITHUB_MANIFEST_USERNAME,
      config.MANIFEST,
      config.MANIFEST_ACCESS_TOKEN
    );
  }
  if (config.MANIFEST) {
    manifestRepo = new AzureDevOpsRepo(
      config.AZURE_ORG,
      config.AZURE_PROJECT,
      config.MANIFEST,
      config.AZURE_PIPELINE_ACCESS_TOKEN
    );
  }

  return new Promise(resolve => {
    if (manifestRepo) {
      manifestRepo
        .getManifestSyncState()
        .then(syncCommits => {
          resolve(syncCommits);
        })
        .catch(err => {
          console.log(err);
          resolve(undefined);
        });
    }
  });
};

export const get = async (req: Request, res: Response) => {
  if (config.isValuesValid()) {
    const status = await getManifestRepoSyncState();
    res.json(status || {});
  } else {
    res.status(500).send("Server is not setup correctly");
  }
};
