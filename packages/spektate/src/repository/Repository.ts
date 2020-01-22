import { IAuthor } from "./Author";
import { ITag } from "./Tag";

export interface IRepository {
  manifestSync?: ITag;
  getReleasesURL: () => string;
  getManifestSyncState: () => Promise<ITag[]>;
  getAuthor: (commitId: string) => Promise<IAuthor | undefined>;
}
