import * as deployment from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IAzureDevOpsRepo } from "spektate/lib/repository/IAzureDevOpsRepo";
import { IGitHub } from "spektate/lib/repository/IGitHub";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";
import { IConfig } from "../config";

/**
 * Mock for author fetch
 * @param hasUndefined
 */
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
            username: "",
          };
        } else if ("org" in repo) {
          return {
            imageUrl: "",
            name: "",
            url: `${repo.org}\t${repo.project}\t${repo.repo}`,
            username: "",
          };
        }
      }
      return undefined;
    }
  );
};

/**
 * Mock for PR fetch
 * @param hasUndefined
 */
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
              "https://dev.azure.com/epicorg/f8a98d9c-8f11-46ef-89e4-07b4a56d1ad5/_release?releaseId=643",
          };
        } else if ("org" in repo) {
          return {
            description: "",
            id: parseInt(prId, 10),
            sourceBranch: "master",
            targetBranch: "master",
            title: `oh-pr-oh-pr-for-${repo.org}`,
            url:
              "https://dev.azure.com/epicorg/f8a98d9c-8f11-46ef-89e4-07b4a56d1ad5/_release?releaseId=643",
          };
        }
      }
      return undefined;
    }
  );
};

/**
 * Mock for config
 */
export const getMockedConfig = (): IConfig => {
  return {
    dockerVersion: "mockedVersion",
    githubManifestUsername: "",
    manifestAccessToken: "cf8a78a2abcdsomekey65b0cb9bd8dsomekeyfsomekey",
    manifestRepoName: "hello-manifests",
    org: "epicorg",
    pipelineAccessToken: "cf8a78a2abcdsomekey65b0cb9bd8dsomekeyfsomekey",
    project: "hellobedrock",
    sourceRepoAccessToken: "cf8a78a2abcdsomekey65b0cb9bd8dsomekeyfsomekey",
    storageAccessKey: "access-key-seeeeeecret",
    storageAccountName: "storageaccount",
    storagePartitionKey: "partition-key",
    storageTableName: "table-name",
    sourceRepo: "",
    hldRepo: "",
    sourceRepoProjectId: "",
    hldRepoProjectId: "",
    manifestProjectId: "",
  };
};
