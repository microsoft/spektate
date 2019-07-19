import { HttpHelper } from "../HttpHelper";
import { Repository } from './Repository';

const manifestSyncTagURL = "https://api.github.com/repos/<owner>/<repo>/git/refs/tags/flux-sync";
export class GitHub extends Repository {
    public username: string;
    public reponame: string;


    constructor(username: string, reponame: string) {
        super();
        this.reponame = reponame;
        this.username = username;
        this.getManifestSyncState();
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
}