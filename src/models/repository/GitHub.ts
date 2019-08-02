import { HttpHelper } from "../HttpHelper";
import { Author } from "./Author";
import { Repository } from './Repository';

const manifestSyncTagURL = "https://api.github.com/repos/<owner>/<repo>/git/refs/tags/flux-sync";
const authorInfoURL = "//api.github.com/repos/<owner>/<repo>/commits/<commitId>";
export class GitHub extends Repository {
    public username: string;
    public reponame: string;


    constructor(username: string, reponame: string) {
        super();
        this.reponame = reponame;
        this.username = username;
    }

    public getManifestSyncState(callback: (syncCommit: string) => void): Promise<void> {
        let tag;
        return new Promise((resolve, reject) => {
            HttpHelper.httpGet(manifestSyncTagURL.replace("<owner>", this.username).replace("<repo>", this.reponame), (data) => {
                tag = data.data;
                if (tag != null) {
                    HttpHelper.httpGet(tag.object.url, (syncStatus) => {
                        resolve();
                        if (syncStatus != null) {
                            this.manifestSync = syncStatus.data.object.sha.substring(0, 7);
                            callback(this.manifestSync);
                        }
                    });
                }
            });
        });
    }

    public getAuthor(commitId: string, callback?: (author: Author) => void): void {
        HttpHelper.httpGet(authorInfoURL.replace("<owner>", this.username).replace("<repo>", this.reponame).replace("<commitId>", commitId), (data) => {
            const authorInfo = data.data;
            if (authorInfo != null) {
                const author = new Author(authorInfo.author.html_url, authorInfo.commit.author.name, authorInfo.committer.login);
                if (callback) {
                    callback(author);
                }
            }
        });
    }
}