import { IDeployment } from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";
import { IConfig } from "../config";

export interface IDeploymentData extends IDeployment {
  author?: IAuthor | undefined;
  pullRequest?: IPullRequest | undefined;
}

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
  };
};

export const deepClone = <T>(o: T): T => {
  return JSON.parse(JSON.stringify(o));
};
