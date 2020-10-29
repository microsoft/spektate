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
import {
  getManifestSyncState as getGitlabClusterSync,
  getReleasesURL as getGitlabReleasesURL,
  IGitlabRepo,
} from "spektate/lib/repository/IGitlabRepo";

/**
 * Gets manifest repo sync state to determine cluster sync status
 */
export const get = (): Promise<IClusterSync | undefined> => {
  let manifestRepo: IAzureDevOpsRepo | IGitHub | IGitlabRepo | undefined;
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
  } else if (
    config.manifestRepoName &&
    config.manifestRepoName !== "" &&
    config.org &&
    config.project
  ) {
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
  } else if (
    config.sourceRepoProjectId &&
    config.hldRepoProjectId &&
    config.manifestProjectId
  ) {
    manifestRepo = {
      projectId: config.manifestProjectId,
    };

    return new Promise((resolve, reject) => {
      getGitlabClusterSync(
        manifestRepo as IGitlabRepo,
        config.manifestAccessToken
      )
        .then((syncCommits) => {
          console.log(syncCommits);
          getGitlabReleasesURL(
            manifestRepo as IGitlabRepo,
            config.manifestAccessToken
          ).then((releasesUrl) => {
            console.log(releasesUrl);
            resolve({
              releasesURL: releasesUrl,
              tags: syncCommits,
            });
          });
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }
  return new Promise((resolve, reject) => {
    reject(`No tags were found`);
  });
};
