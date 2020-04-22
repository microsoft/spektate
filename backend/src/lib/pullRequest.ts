import { fetchPR, getRepositoryFromURL } from "spektate/lib/IDeployment";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";
import * as config from "../config";
import { IDeploymentData } from "./common";

/**
 * Returns author information
 *
 * @param deployment Deployment instance
 */
export const get = async (
  deployment: IDeploymentData
): Promise<IPullRequest | undefined> => {
  if (deployment.hldRepo && deployment.pr) {
    const repo = getRepositoryFromURL(deployment.hldRepo);

    if (repo && ("username" in repo || "org" in repo)) {
      return await fetchPR(
        repo,
        deployment.pr.toString(),
        config.SOURCE_REPO_ACCESS_TOKEN || config.AZURE_PIPELINE_ACCESS_TOKEN
      );
    }
  }

  return undefined;
};
