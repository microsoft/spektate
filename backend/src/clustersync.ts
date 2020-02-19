import { Request, Response } from "express";
import { AzureDevOpsRepo } from "spektate/lib/repository/AzureDevOpsRepo";
import {
  getManifestSyncState as getADOClusterSync,
  getReleasesURL as getADOReleasesURL,
  IAzureDevOpsRepo
} from "spektate/lib/repository/IAzureDevOpsRepo";
import {
  getManifestSyncState as getGitHubClusterSync,
  getReleasesURL as getGitHubReleasesURL,
  IGitHub
} from "spektate/lib/repository/IGitHub";
import { IClusterSync } from "spektate/lib/repository/Tag";
import * as config from "./config";

const getManifestRepoSyncState = (): Promise<IClusterSync | undefined> => {
  let manifestRepo: IAzureDevOpsRepo | IGitHub | undefined;
  let releasesURL = "";

  if (
    config.MANIFEST &&
    config.GITHUB_MANIFEST_USERNAME &&
    config.GITHUB_MANIFEST_USERNAME !== ""
  ) {
    manifestRepo = {
      reponame: config.MANIFEST,
      username: config.GITHUB_MANIFEST_USERNAME
    };
    releasesURL = getGitHubReleasesURL(manifestRepo);

    return new Promise((resolve, reject) => {
      getGitHubClusterSync(
        manifestRepo as IGitHub,
        config.MANIFEST_ACCESS_TOKEN
      )
        .then(syncCommits => {
          resolve({
            releasesURL,
            tags: syncCommits
          });
        })
        .catch(err => {
          console.log(err);
          reject(undefined);
        });
    });
  } else if (config.MANIFEST) {
    manifestRepo = new AzureDevOpsRepo(
      config.AZURE_ORG,
      config.AZURE_PROJECT,
      config.MANIFEST
    );
    releasesURL = getADOReleasesURL(manifestRepo);
    return new Promise((resolve, reject) => {
      getADOClusterSync(
        manifestRepo as IAzureDevOpsRepo,
        config.MANIFEST_ACCESS_TOKEN
      )
        .then(syncCommits => {
          resolve({
            releasesURL,
            tags: syncCommits
          });
        })
        .catch(err => {
          console.log(err);
          reject(undefined);
        });
    });
  }
  return new Promise((resolve, reject) => {
    reject(`No tags were found`);
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
