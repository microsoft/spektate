import { IDeployment } from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";

export interface IDeploymentData extends IDeployment {
  author?: IAuthor | undefined;
  pullRequest?: IPullRequest | undefined;
}

export const deepClone = <T>(o: T): T => {
  return JSON.parse(JSON.stringify(o));
};
