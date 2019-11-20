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
  public accessToken?: string;
  public manifestSync?: ITag = undefined;

  constructor(
    org: string,
    project: string,
    repo: string,
    accessToken?: string
  ) {
    this.org = org;
    this.project = project;
    this.repo = repo;
    this.accessToken = accessToken;
  }
  public async getManifestSyncState(): Promise<ITag> {
    return new Promise(async (resolve, reject) => {
      const data = await HttpHelper.httpGet<any>(
        manifestSyncTagsURL
          .replace("{organization}", this.org)
          .replace("{project}", this.project)
          .replace("{repositoryId}", this.repo),
        this.accessToken
      );

      const tags = data.data.value;
      if (tags != null && tags.length > 0) {
        for (const tag of tags) {
          if (tag.name === "refs/tags/flux-sync") {
            const syncStatus = await HttpHelper.httpGet<any>(
              manifestSyncTagURL
                .replace("{organization}", this.org)
                .replace("{project}", this.project)
                .replace("{repositoryId}", this.repo)
                .replace("{objectId}", tag.objectId),
              this.accessToken
            );

            if (syncStatus != null) {
              this.manifestSync = {
                commit: syncStatus.data.taggedObject.objectId.substring(0, 7),
                date: new Date(syncStatus.data.taggedBy.date),
                tagger: syncStatus.data.taggedBy.name
              };
              resolve(this.manifestSync);
              return;
            }
          }
        }
      }
      console.error(
        `Unable to to find flux-sync tag from ${this.org}-${this.project}-${this.repo}`
      );
      reject();
    });
  }

  public async getAuthor(commitId: string) {
    const data = await HttpHelper.httpGet<any>(
      authorInfoURL
        .replace("{organization}", this.org)
        .replace("{project}", this.project)
        .replace("{repositoryId}", this.repo)
        .replace("{commitId}", commitId),
      this.accessToken
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
