import * as deployment from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IAzureDevOpsRepo } from "spektate/lib/repository/IAzureDevOpsRepo";
import { IGitHub } from "spektate/lib/repository/IGitHub";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";

export const mockFetchAuthor = (hasUndefined = false) => {
  jest.spyOn(deployment, "fetchAuthor").mockImplementationOnce(
    async (
      repo: IGitHub | IAzureDevOpsRepo,
      commitId: string,
      accessToken?: string | undefined
    ): Promise<IAuthor | undefined> => {
      if (!hasUndefined) {
        if ("reponame" in repo) {
          return {
            imageUrl: "",
            name: "",
            url: `${repo.reponame}\t${repo.username}`,
            username: ""
          };
        } else if ("org" in repo) {
          return {
            imageUrl: "",
            name: "",
            url: `${repo.org}\t${repo.project}\t${repo.repo}`,
            username: ""
          };
        }
      }
      return undefined;
    }
  );
};

export const mockFetchPullRequest = (hasUndefined = false) => {
  jest.spyOn(deployment, "fetchPR").mockImplementationOnce(
    async (
      repo: IGitHub | IAzureDevOpsRepo,
      prId: string,
      accessToken?: string | undefined
    ): Promise<IPullRequest | undefined> => {
      if (!hasUndefined) {
        if ("reponame" in repo) {
          return {
            description: "",
            id: parseInt(prId, 10),
            sourceBranch: "master",
            targetBranch: "master",
            title: `oh-pr-oh-pr-for-${repo.reponame}`,
            url:
              "https://dev.azure.com/epicorg/f8a98d9c-8f11-46ef-89e4-07b4a56d1ad5/_release?releaseId=643"
          };
        } else if ("org" in repo) {
          return {
            description: "",
            id: parseInt(prId, 10),
            sourceBranch: "master",
            targetBranch: "master",
            title: `oh-pr-oh-pr-for-${repo.org}`,
            url:
              "https://dev.azure.com/epicorg/f8a98d9c-8f11-46ef-89e4-07b4a56d1ad5/_release?releaseId=643"
          };
        }
      }
      return undefined;
    }
  );
};
