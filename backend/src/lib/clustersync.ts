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
import {
  getNewConfig,
  RepositoryType,
  IGitlabRepoConfig,
  IAzDOPipelineConfig,
  IGithubRepoConfig,
  IAzDORepoConfig,
} from "../config";
import {
  getManifestSyncState as getGitlabClusterSync,
  getReleasesURL as getGitlabReleasesURL,
  IGitlabRepo,
} from "spektate/lib/repository/IGitlabRepo";
import { getRepositoryFromURL } from "spektate/lib/IDeployment";

/**
 * Gets manifest repo sync state to determine cluster sync status
 */
export const get = (): Promise<IClusterSync | undefined> => {
  let manifestRepo: IAzureDevOpsRepo | IGitHub | IGitlabRepo | undefined;
  let releasesURL = "";
  const config = getNewConfig();

  if (config.repoType === RepositoryType.GITHUB) {
    manifestRepo = getRepositoryFromURL(
      (config.repoConfig as IGithubRepoConfig).manifestRepo
    );
    releasesURL = getGitHubReleasesURL(manifestRepo as IGitHub);

    return new Promise((resolve, reject) => {
      getGitHubClusterSync(
        manifestRepo as IGitHub,
        config.repoConfig.accessToken
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
  } else if (config.repoType === RepositoryType.AZDO) {
    let repoName = (config.repoConfig as IAzDORepoConfig).manifestRepo;
    if (repoName.includes("/")) {
      repoName = repoName.split("/").pop() ?? repoName;
    }
    manifestRepo = {
      org: (config.pipelineConfig as IAzDOPipelineConfig).org,
      project: (config.pipelineConfig as IAzDOPipelineConfig).project,
      repo: repoName,
    };
    releasesURL = getADOReleasesURL(manifestRepo);
    return new Promise((resolve, reject) => {
      getADOClusterSync(
        manifestRepo as IAzureDevOpsRepo,
        config.repoConfig.accessToken
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
  } else if (config.repoType === RepositoryType.GITLAB) {
    manifestRepo = {
      projectId: (config.repoConfig as IGitlabRepoConfig).manifestProjectId,
    };

    return new Promise((resolve, reject) => {
      getGitlabClusterSync(
        manifestRepo as IGitlabRepo,
        config.repoConfig.accessToken
      )
        .then((syncCommits) => {
          getGitlabReleasesURL(
            manifestRepo as IGitlabRepo,
            config.repoConfig.accessToken
          ).then((releasesUrl) => {
            resolve({
              releasesURL: releasesUrl,
              tags: syncCommits,
            });
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
  return Promise.reject("No tags were found");
};
