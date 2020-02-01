import { IAuthor } from "./Author";
import { IPullRequest } from "./PullRequest";
import { ITag } from "./Tag";

export interface IRepository {
  manifestSync?: ITag;
  getReleasesURL: () => string;
  getManifestSyncState: () => Promise<ITag[]>;
  getAuthor: (commitId: string) => Promise<IAuthor | undefined>;
  getPullRequest: (prId: string) => Promise<IPullRequest | undefined>;
}
