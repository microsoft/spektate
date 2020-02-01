import { HttpHelper } from "../HttpHelper";
import { IAuthor } from "./Author";
import { IPullRequest } from "./PullRequest";
import { IRepository } from "./Repository";
import { ITag } from "./Tag";

const manifestSyncTagsURL =
  "https://api.github.com/repos/<owner>/<repo>/git/refs/tags";
const authorInfoURL =
  "https://api.github.com/repos/<owner>/<repo>/commits/<commitId>";
const pullRequestURL =
  "https://api.github.com/repos/<owner>/<repo>/pulls/<pullRequestId>";

export class GitHub implements IRepository {
  public username: string;
  public reponame: string;
  public accessToken?: string;

  constructor(username: string, reponame: string, accessToken?: string) {
    this.reponame = reponame;
    this.username = username;
    this.accessToken = accessToken;
  }

  public getReleasesURL(): string {
    return (
      "https://github.com/" + this.username + "/" + this.reponame + "/releases"
    );
  }

  public getPullRequest = async (
    prId: string
  ): Promise<IPullRequest | undefined> => {
    return new Promise(async (resolve, reject) => {
      const data = await HttpHelper.httpGet<any>(
        pullRequestURL
          .replace("<owner>", this.username)
          .replace("<repo>", this.reponame)
          .replace("<pullRequestId>", prId),
        this.accessToken
      );

      if (data && data.data) {
        const pr: IPullRequest = {
          URL: data.data.html_url,
          date: new Date(data.data.created_at),
          description: data.data.body,
          id: data.data.number,
          status: data.data.state,
          title: data.data.title
        };
        resolve(pr);
        console.log(pr);
      } else {
        reject();
      }
    });
  };

  public async getManifestSyncState(): Promise<ITag[]> {
    return new Promise(async (resolve, reject) => {
      const allTags = await HttpHelper.httpGet<any>(
        manifestSyncTagsURL
          .replace("<owner>", this.username)
          .replace("<repo>", this.reponame),
        this.accessToken
      );
      const tags = allTags.data;
      if (tags != null && tags.length > 0) {
        const fluxTags: ITag[] = [];
        for (const fluxTag of tags) {
          const data = await HttpHelper.httpGet<any>(
            fluxTag.url
              .replace("<owner>", this.username)
              .replace("<repo>", this.reponame),
            this.accessToken
          );

          const tag = data.data;
          if (tag != null) {
            const syncStatus = await HttpHelper.httpGet<any>(
              tag.object.url,
              this.accessToken
            );

            if (syncStatus != null) {
              const clusterName = syncStatus.data.tag.replace("flux-", "");
              const manifestSync = {
                commit: syncStatus.data.object.sha.substring(0, 7),
                date: new Date(syncStatus.data.tagger.date),
                message: syncStatus.data.message,
                name: clusterName.toUpperCase(),
                tagger: syncStatus.data.tagger.name
              };
              fluxTags.push(manifestSync);
            }
          }
        }
        resolve(fluxTags);
        return;
      }

      console.error(
        `Unable to sync manifests for Github repo ${this.username}/${this.reponame}`
      );
      reject();
    });
  }

  public async getAuthor(commitId: string) {
    const data = await HttpHelper.httpGet<any>(
      authorInfoURL
        .replace("<owner>", this.username)
        .replace("<repo>", this.reponame)
        .replace("<commitId>", commitId),
      this.accessToken
    );

    const authorInfo = data.data;
    if (authorInfo != null) {
      const author: IAuthor = {
        imageUrl: authorInfo.author ? authorInfo.author.avatar_url : "",
        name: authorInfo.commit.author.name,
        url: authorInfo.author ? authorInfo.author.html_url : "",
        username: authorInfo.committer ? authorInfo.committer.login : ""
      };
      return author;
    }
  }
}
