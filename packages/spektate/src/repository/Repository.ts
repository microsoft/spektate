import { IAuthor } from "./Author";
import { ITag } from "./Tag";

// export enum RepositoryType {
//   GitHub = 1,
//   AzureDevOps = 2
// }

export interface IRepository {
  manifestSync?: ITag;
  // type: RepositoryType;
  // getReleasesURL: () => string;
  // getManifestSyncState: (accessToken?: string) => Promise<ITag[]>;
  // getAuthor: (
  //   commitId: string,
  //   accessToken?: string
  // ) => Promise<IAuthor | undefined>;
}
