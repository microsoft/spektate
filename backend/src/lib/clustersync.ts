import {
  getManifestSyncState as getADOClusterSync,
  getReleasesURL as getADOReleasesURL,
  IAzureDevOpsRepo,
} from "spektate/lib/repository/IAzureDevOpsRepo";
import {
  getManifestSyncState as getGitHubClusterSync,
  getReleasesURL as getGitHubReleasesURL,
  IGitHub,
} from "spektate/lib/repository/IGitHub";
import { IClusterSync } from "spektate/lib/repository/Tag";
import { getConfig } from "../config";

/**
 * Gets manifest repo sync state to determine cluster sync status
 */
export const get = (): Promise<IClusterSync | undefined> => {
  let manifestRepo: IAzureDevOpsRepo | IGitHub | undefined;
  let releasesURL = "";
  const config = getConfig();

  if (
    config.manifestRepoName &&
    config.githubManifestUsername &&
    config.githubManifestUsername !== ""
  ) {
    manifestRepo = {
      reponame: config.manifestRepoName,
      username: config.githubManifestUsername,
    };
    releasesURL = getGitHubReleasesURL(manifestRepo);

    return new Promise((resolve, reject) => {
      getGitHubClusterSync(manifestRepo as IGitHub, config.manifestAccessToken)
        .then((syncCommits) => {
          resolve({
            releasesURL,
            tags: syncCommits,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  } else if (config.manifestRepoName && config.manifestRepoName !== "") {
    manifestRepo = {
      org: config.org,
      project: config.project,
      repo: config.manifestRepoName,
    };
    releasesURL = getADOReleasesURL(manifestRepo);
    return new Promise((resolve, reject) => {
      getADOClusterSync(
        manifestRepo as IAzureDevOpsRepo,
        config.manifestAccessToken
      )
        .then((syncCommits) => {
          resolve({
            releasesURL,
            tags: syncCommits,
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  return new Promise((resolve, reject) => {
    reject(`No tags were found`);
  });
};
