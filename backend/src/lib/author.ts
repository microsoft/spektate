import { fetchAuthor, getRepositoryFromURL } from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IAzureDevOpsRepo } from "spektate/lib/repository/IAzureDevOpsRepo";
import { IGitHub } from "spektate/lib/repository/IGitHub";
import { getConfig, isConfigValid } from "../config";
import { IDeploymentData } from "./common";
import { IGitlabRepo } from "spektate/lib/repository/IGitlabRepo";

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

  if (!isConfigValid()) {
    return Promise.reject("Configuration is invalid");
  }

  let repo: IAzureDevOpsRepo | IGitHub | IGitlabRepo | undefined =
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
    return fetchAuthor(
      repo,
      commit,
      config.repoConfig.accessToken || config.pipelineConfig.accessToken
    );
  }

  return undefined;
};
