import { IAuthor } from "./Author";

export interface IPullRequest {
  id: number;
  title: string;
  sourceBranch: string;
  targetBranch: string;
  description: string;
  mergedBy?: IAuthor;
  url: string;
}
