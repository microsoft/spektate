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
  public repoName: string;
  public accessToken?: string;
  public manifestSync?: ITag;

  constructor(username: string, repoName: string, accessToken?: string) {
    this.repoName = repoName;
    this.username = username;
    this.accessToken = accessToken;
  }

  public getManifestSyncState(
    callback: (syncTag: ITag) => void
  ): Promise<void> {
    let tag;
    return new Promise((resolve, reject) => {
      HttpHelper.httpGet(
        manifestSyncTagURL
          .replace("<owner>", this.username)
          .replace("<repo>", this.repoName),
        data => {
          tag = data.data;
          if (tag != null) {
            HttpHelper.httpGet(
              tag.object.url,
              syncStatus => {
                resolve();
                if (syncStatus != null) {
                  this.manifestSync = {
                    commit: syncStatus.data.object.sha.substring(0, 7),
                    date: new Date(syncStatus.data.tagger.date),
                    message: syncStatus.data.message,
                    tagger: syncStatus.data.tagger.name
                  };
                  callback(this.manifestSync);
                }
              },
              this.accessToken
            );
          }
        },
        this.accessToken
      );
    });
  }

  public getAuthor(
    commitId: string,
    callback?: (author: IAuthor) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      HttpHelper.httpGet(
        authorInfoURL
          .replace("<owner>", this.username)
          .replace("<repo>", this.repoName)
          .replace("<commitId>", commitId),
        data => {
          const authorInfo = data.data;
          if (authorInfo != null) {
            const author: IAuthor = {
              URL: authorInfo.author.html_url,
              name: authorInfo.commit.author.name,
              username: authorInfo.committer.login
            };
            resolve();
            if (callback) {
              callback(author);
            }
          }
        },
        this.accessToken
      );
    });
  }
}
