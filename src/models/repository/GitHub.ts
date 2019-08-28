import { HttpHelper } from "../HttpHelper";
import { Author } from "./Author";
import { Repository } from "./Repository";
import { Tag } from "./Tag";

const manifestSyncTagURL =
  "https://api.github.com/repos/<owner>/<repo>/git/refs/tags/flux-sync";
const authorInfoURL =
  "https://api.github.com/repos/<owner>/<repo>/commits/<commitId>";
export class GitHub extends Repository {
  public username: string;
  public reponame: string;
  public accessToken?: string;

  constructor(username: string, reponame: string, accessToken?: string) {
    super();
    this.reponame = reponame;
    this.username = username;
    this.accessToken = accessToken;
  }

  public getManifestSyncState(callback: (syncTag: Tag) => void): Promise<void> {
    let tag;
    return new Promise((resolve, reject) => {
      HttpHelper.httpGet(
        manifestSyncTagURL
          .replace("<owner>", this.username)
          .replace("<repo>", this.reponame),
        data => {
          tag = data.data;
          if (tag != null) {
            HttpHelper.httpGet(
              tag.object.url,
              syncStatus => {
                resolve();
                if (syncStatus != null) {
                  this.manifestSync = new Tag(
                    syncStatus.data.object.sha.substring(0, 7),
                    new Date(syncStatus.data.tagger.date),
                    syncStatus.data.tagger.name,
                    syncStatus.data.message
                  );
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
    callback?: (author: Author) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      HttpHelper.httpGet(
        authorInfoURL
          .replace("<owner>", this.username)
          .replace("<repo>", this.reponame)
          .replace("<commitId>", commitId),
        data => {
          const authorInfo = data.data;
          if (authorInfo != null) {
            const author = new Author(
              authorInfo.author.html_url,
              authorInfo.commit.author.name,
              authorInfo.committer.login
            );
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
