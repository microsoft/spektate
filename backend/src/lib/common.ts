import { IDeployment } from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";

export interface IDeploymentData extends IDeployment {
  author?: IAuthor | undefined;
  pullRequest?: IPullRequest | undefined;
}

export const setProcessEnv = (): void => {
  process.env.REACT_APP_STORAGE_ACCESS_KEY = "somekey";
  process.env.REACT_APP_STORAGE_TABLE_NAME = "deployments";
  process.env.REACT_APP_STORAGE_PARTITION_KEY = "hello-bedrock";
  process.env.REACT_APP_STORAGE_ACCOUNT_NAME = "storage";
  process.env.REACT_APP_PIPELINE_PROJECT = "hellobedrock";
  process.env.REACT_APP_PIPELINE_ORG = "epicorg";
  process.env.REACT_APP_PIPELINE_ACCESS_TOKEN =
    "abcdefbc5bv4drxldepvtm67y26d52vvt3yokwhfk7dajwabcdefbc";
  process.env.REACT_APP_SOURCE_REPO_ACCESS_TOKEN =
    "cf8a78a2abcdefbcb8e4365b0cb9bd8d9babcdefbc";
  process.env.REACT_APP_GITHUB_MANIFEST_USERNAME = "samiyaakhtar";
  process.env.REACT_APP_MANIFEST = "hello-bedrock-manifest";
  process.env.REACT_APP_MANIFEST_ACCESS_TOKEN =
    "cf8a78a2abcdefbcb8e4365b0cb9bd8d9babcdefbc";
};

export const deepClone = <T>(o: T): T => {
  return JSON.parse(JSON.stringify(o));
};
