import { HttpHelper } from "../HttpHelper";
import { IAuthor } from "./Author";
import { IRepository } from "./Repository";
import { ITag } from "./Tag";

const manifestSyncTagURL =
  "https://api.github.com/repos/<owner>/<repo>/git/refs/tags/flux-sync";
const authorInfoURL =
  "https://api.github.com/repos/<owner>/<repo>/commits/<commitId>";

export class GitHub implements IRepository {
  public username: string;
  public reponame: string;
  public accessToken?: string;
  public manifestSync?: ITag;

  constructor(username: string, reponame: string, accessToken?: string) {
    this.reponame = reponame;
    this.username = username;
    this.accessToken = accessToken;
  }

  public async getManifestSyncState() {
    const data = await HttpHelper.httpGet<any>(
      manifestSyncTagURL
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
        this.manifestSync = {
          commit: syncStatus.data.object.sha.substring(0, 7),
          date: new Date(syncStatus.data.tagger.date),
          message: syncStatus.data.message,
          tagger: syncStatus.data.tagger.name
        };
        return this.manifestSync;
      }
    }

    throw new Error(
      `Unable to sync manifests for Github repo ${this.username}/${this.reponame}`
    );
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
        name: authorInfo.commit.author.name,
        url: authorInfo.author.html_url,
        username: authorInfo.committer.login
      };
      return author;
    }

    throw new Error(
      `Unable to get author for github repo ${this.username}/${this.reponame}`
    );
  }
}
