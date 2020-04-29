import { fetchAuthor, getRepositoryFromURL } from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IAzureDevOpsRepo } from "spektate/lib/repository/IAzureDevOpsRepo";
import { IGitHub } from "spektate/lib/repository/IGitHub";
import { getConfig } from "../config";
import { IDeploymentData } from "./common";

/**
 * Fetches author information
 *
 * @param deployment Deployment instance
 */
export const get = async (
  deployment: IDeploymentData
): Promise<IAuthor | undefined> => {
  const config = getConfig();
  let commit =
    deployment.srcToDockerBuild?.sourceVersion ||
    deployment.hldToManifestBuild?.sourceVersion;

  let repo: IAzureDevOpsRepo | IGitHub | undefined =
    deployment.srcToDockerBuild?.repository ||
    deployment.hldToManifestBuild?.repository;
  if (!repo && deployment.sourceRepo) {
    repo = getRepositoryFromURL(deployment.sourceRepo);
    commit = deployment.srcToDockerBuild?.sourceVersion;
  }
  if (!repo && deployment.hldRepo) {
    repo = getRepositoryFromURL(deployment.hldRepo);
    commit = deployment.hldToManifestBuild?.sourceVersion;
  }

  if (commit && repo) {
    if ("username" in repo) {
      return await fetchAuthor(
        {
          reponame: repo.reponame,
          username: repo.username,
        },
        commit,
        config.sourceRepoAccessToken || config.pipelineAccessToken
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
        config.sourceRepoAccessToken || config.pipelineAccessToken
      );
    }
  }
  return undefined;
};
