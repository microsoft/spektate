import { HttpHelper } from "../HttpHelper";
import { IAuthor } from "./Author";
import { IRepository } from "./Repository";
import { ITag } from "./Tag";

const authorInfoURL =
  "https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/commits/{commitId}?api-version=4.1";
const manifestSyncTagsURL =
  "https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/refs?filter=tags&api-version=4.1";
const manifestSyncTagURL =
  "https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/annotatedtags/{objectId}?api-version=4.1-preview.1";

export class AzureDevOpsRepo implements IRepository {
  public org: string;
  public project: string;
  public repo: string;
  public manifestSync?: ITag = undefined;

  constructor(org: string, project: string, repo: string) {
    this.org = org;
    this.project = project;
    this.repo = repo;
  }

  public getReleasesURL(): string {
    return (
      "https://dev.azure.com/" +
      this.org +
      "/" +
      this.project +
      "/_git/" +
      this.repo +
      "/tags"
    );
  }

  public async getManifestSyncState(accessToken?: string): Promise<ITag[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await HttpHelper.httpGet<any>(
          manifestSyncTagsURL
            .replace("{organization}", this.org)
            .replace("{project}", this.project)
            .replace("{repositoryId}", this.repo),
          accessToken
        );

        const tags = data.data.value;
        const fluxTags: ITag[] = [];
        if (tags != null && tags.length > 0) {
          for (const tag of tags) {
            // Check all flux sync tags
            if (tag.name.includes("refs/tags/flux-")) {
              const syncStatus = await HttpHelper.httpGet<any>(
                manifestSyncTagURL
                  .replace("{organization}", this.org)
                  .replace("{project}", this.project)
                  .replace("{repositoryId}", this.repo)
                  .replace("{objectId}", tag.objectId),
                accessToken
              );

              if (syncStatus != null) {
                const clusterName: string = syncStatus.data.name.replace(
                  "flux-",
                  ""
                );
                this.manifestSync = {
                  commit: syncStatus.data.taggedObject.objectId.substring(0, 7),
                  date: new Date(syncStatus.data.taggedBy.date),
                  name: clusterName.toUpperCase(),
                  tagger: syncStatus.data.taggedBy.name
                };
                fluxTags.push(this.manifestSync);
              }
            }
          }
          resolve(fluxTags);
          return;
        }
        // No tags were found.
        resolve([]);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async getAuthor(commitId: string, accessToken?: string) {
    const data = await HttpHelper.httpGet<any>(
      authorInfoURL
        .replace("{organization}", this.org)
        .replace("{project}", this.project)
        .replace("{repositoryId}", this.repo)
        .replace("{commitId}", commitId),
      accessToken
    );

    const commitInfo = data.data;
    if (commitInfo && commitInfo.author) {
      const author: IAuthor = {
        imageUrl: commitInfo.author.imageUrl,
        name: commitInfo.author.name,
        url: commitInfo.author.imageUrl,
        username: commitInfo.author.email
      };
      return author;
    }
  }
}
