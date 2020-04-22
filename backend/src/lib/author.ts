import { fetchAuthor, getRepositoryFromURL } from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IAzureDevOpsRepo } from "spektate/lib/repository/IAzureDevOpsRepo";
import { IGitHub } from "spektate/lib/repository/IGitHub";
import * as config from "../config";
import { IDeploymentData } from "./common";

/**
 * Returns author information
 *
 * @param deployment Deployment instance
 */
export const get = async (
  deployment: IDeploymentData
): Promise<IAuthor | undefined> => {
  const commit =
    deployment.srcToDockerBuild?.sourceVersion ||
    deployment.hldToManifestBuild?.sourceVersion;

  let repo: IAzureDevOpsRepo | IGitHub | undefined =
    deployment.srcToDockerBuild?.repository;
  if (!repo && deployment.sourceRepo) {
    repo = getRepositoryFromURL(deployment.sourceRepo);
  }
  if (!repo && deployment.hldToManifestBuild) {
    repo = deployment.hldToManifestBuild.repository;
  }
  if (!repo && deployment.hldRepo) {
    repo = getRepositoryFromURL(deployment.hldRepo);
  }

  if (commit && repo) {
    if ("username" in repo) {
      return await fetchAuthor(
        {
          reponame: repo.reponame,
          username: repo.username,
        },
        commit,
        config.SOURCE_REPO_ACCESS_TOKEN || config.AZURE_PIPELINE_ACCESS_TOKEN
      );
    }
    if ("org" in repo) {
      return await fetchAuthor(
        {
          org: repo.org,
          project: repo.project,
          repo: repo.repo,
        },
        commit,
        config.SOURCE_REPO_ACCESS_TOKEN || config.AZURE_PIPELINE_ACCESS_TOKEN
      );
    }
  }
  return undefined;
};
