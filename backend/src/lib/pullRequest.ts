import { fetchPR, getRepositoryFromURL } from "spektate/lib/IDeployment";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";
import { getConfig } from "../config";
import { IDeploymentData } from "./common";

/**
 * Fetches PR information
 *
 * @param deployment Deployment instance
 */
export const get = async (
  deployment: IDeploymentData
): Promise<IPullRequest | undefined> => {
  const config = getConfig();
  if (deployment.hldRepo && deployment.pr) {
    const repo = getRepositoryFromURL(deployment.hldRepo);

    if (repo) {
      return await fetchPR(
        repo,
        deployment.pr.toString(),
        config.sourceRepoAccessToken || config.pipelineAccessToken
      );
    }
  }

  return undefined;
};
