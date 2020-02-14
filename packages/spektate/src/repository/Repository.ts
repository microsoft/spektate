import { IAuthor } from "./Author";
import { ITag } from "./Tag";

export interface IRepository {
  manifestSync?: ITag;
  getReleasesURL: () => string;
  getManifestSyncState: (accessToken?: string) => Promise<ITag[]>;
  getAuthor: (
    commitId: string,
    accessToken?: string
  ) => Promise<IAuthor | undefined>;
}
