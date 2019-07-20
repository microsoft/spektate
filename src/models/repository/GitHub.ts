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

    public getManifestSyncState() {
        const tag = JSON.parse(HttpHelper.httpGet(manifestSyncTagURL.replace("<owner>", this.username).replace("<repo>", this.reponame)));
        if (tag != null) {
            const syncStatus = JSON.parse(HttpHelper.httpGet(tag.object.url));
            if (syncStatus != null) {
                this.manifestSync = syncStatus.object.sha.substring(0, 7);
            }
        }
    }

    public getAuthor(commitId: string): Author | undefined {
        // tslint:disable-next-line:no-console
        console.log("Being called for " + commitId);
        const authorInfo = JSON.parse(HttpHelper.httpGet(authorInfoURL.replace("<owner>", this.username).replace("<repo>", this.reponame).replace("<commitId>", commitId)));
        if (authorInfo != null) {
            const author = new Author(authorInfo.author.html_url, authorInfo.commit.author.name, authorInfo.committer.login);
            return author;
        }

        return undefined;
    }
}