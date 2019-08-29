import { IAuthor } from "./Author";
import { ITag } from "./Tag";

export interface IRepository {
  manifestSync?: ITag;
  getManifestSyncState: (callback: (syncTag: ITag) => void) => Promise<void>;
  getAuthor: (
    commitId: string,
    callback?: (author: IAuthor) => void
  ) => Promise<void>;
}
