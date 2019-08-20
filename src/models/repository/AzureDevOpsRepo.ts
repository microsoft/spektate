import { HttpHelper } from '../HttpHelper';
import { Author } from './Author';
import { Repository } from './Repository';
import { Tag } from './Tag';

const authorInfoURL = "https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/commits/{commitId}?api-version=4.1";
const manifestSyncTagsURL = "https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/refs?filter=tags&api-version=4.1";
const manifestSyncTagURL = "https://dev.azure.com/{organization}/{project}/_apis/git/repositories/{repositoryId}/annotatedtags/{objectId}?api-version=4.1-preview.1";

export class AzureDevOpsRepo extends Repository {
    public org: string;
    public project: string;
    public repo: string;
    public accessToken?: string;

    constructor(org: string, project: string, repo: string, accessToken?: string) {
        super();
        this.org = org;
        this.project = project;
        this.repo = repo;
        this.accessToken = accessToken;
    }
    public getManifestSyncState(callback: (syncTag: Tag) => void): Promise<void> {
        let tags;
        return new Promise((resolve, reject) => {
            HttpHelper.httpGet(manifestSyncTagsURL.replace("{organization}", this.org).replace("{project}", this.project).replace("{repositoryId}", this.repo), (data) => {
                tags = data.data.value;
                if (tags != null && tags.length > 0) {
                    // tslint:disable-next-line: prefer-for-of
                    for (let i = 0; i < tags.length; i++) {
                        if (tags[i].name === "refs/tags/flux-sync") {
                            const objectId = tags[i].objectId;
                            HttpHelper.httpGet(manifestSyncTagURL.replace("{organization}", this.org).replace("{project}", this.project).replace("{repositoryId}", this.repo).replace("{objectId}", objectId), (syncStatus) => {
                                resolve();
                                if (syncStatus != null) {
                                    this.manifestSync = new Tag(syncStatus.data.taggedObject.objectId.substring(0, 7), new Date());
                                    callback(this.manifestSync);
                                }
                            }, this.accessToken);
                        }
                    }
                    
                }
            }, this.accessToken);
        });
    }
    public getAuthor(commitId: string, callback?: ((author: Author) => void) | undefined): Promise<void> {
        return new Promise((resolve, reject) => {
            HttpHelper.httpGet(authorInfoURL.replace("{organization}", this.org).replace("{project}", this.project).replace("{repositoryId}", this.repo).replace("{commitId}", commitId), (data) => {
                const commitInfo = data.data;
                if (commitInfo) {
                    const author = new Author(commitInfo.author.imageUrl, commitInfo.author.name, commitInfo.author.email);
                    resolve();
                    if (callback) {
                        callback(author);
                    }
                }
            }, this.accessToken);
        })
    }
}