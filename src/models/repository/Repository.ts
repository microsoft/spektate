import { IAuthor } from "./Author";
import { ITag } from "./Tag";

export interface IRepository {
  manifestSync?: ITag;
  getManifestSyncState: () => Promise<ITag>;
  getAuthor: (commitId: string) => Promise<IAuthor>;
}
