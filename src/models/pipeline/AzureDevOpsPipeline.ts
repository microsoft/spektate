import { HttpHelper } from "../HttpHelper";
import { GitHub } from '../repository/GitHub';
import { Build } from "./Build";
import Pipeline from "./Pipeline";
import { Release } from "./Release";

const buildFilterUrl = "https://dev.azure.com/{organization}/{project}/_apis/build/builds?definitions={definitionId}&buildIds={buildIds}&api-version=5.0&queryOrder=startTimeDescending";
const baseBuildUrl = "https://dev.azure.com/{organization}/{project}/_apis/build/builds?definitions={definitionId}&api-version=5.0&queryOrder=startTimeDescending";
const baseReleaseUrl = "https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/deployments?api-version=5.0&definitionId={definitionId}&queryOrder=startTimeDescending";

class AzureDevOpsPipeline extends Pipeline {
    // User defined fields
    public org: string;
    public project: string;
    public definitionId: number;
    public isRelease?: boolean;
    
    constructor(org: string, project: string, definitionId: number, isRelease?: boolean) {
        super();
        this.org = org;
        this.project = project;
        this.definitionId = definitionId;
        this.isRelease = isRelease;
    }

    public async getListOfBuilds(callback?: (data: any) => void, buildIds?: Set<string>): Promise<void> {
        const buildUrl = this.getBuildUrl(buildIds);
        // tslint:disable-next-line: no-console
        // console.log("Making call to " + buildUrl);
        return new Promise((resolve, reject) => {
            HttpHelper.httpGet(buildUrl, (json) => {
                const builds: Build[] = [];
                for (const row of json.data.value) {
                    const build = new Build();
                    build.author = row.requestedFor.displayName;
                    build.buildNumber = row.buildNumber;
                    build.id = row.id;
                    build.queueTime = new Date(row.queueTime);
                    build.sourceBranch = row.sourceBranch;
                    build.status = row.status;
                    build.startTime = new Date(row.startTime);
                    build.URL = row._links.web.href;
                    build.result = row.result;
                    build.sourceVersion = row.sourceVersion;
                    build.sourceVersionURL = row._links.sourceVersionDisplayUri.href;
                    build.finishTime = new Date(row.finishTime);
                    if (row.repository.type === "GitHub") {
                        build.repository = new GitHub(row.repository.id.split('/')[0], row.repository.id.split('/')[1]);
                    }
                    builds.push(build);
                    this.builds[build.id] = build;
                }
                resolve();
                if (callback) {
                    callback(this.builds);
                }
            });
        });
    }

    public async getListOfReleases(callback?: (data: any) => void, releaseIds?: Set<string>): Promise<void> {
        return new Promise((resolve, reject) => {
            HttpHelper.httpGet(this.getReleaseUrl(), (json) => {
                const releases: Release[] = [];
                for (const row of json.data.value) {
                    const release = new Release();
                    release.id = row.id;
                    release.queueTime = new Date(row.queuedOn);
                    release.startTime = new Date(row.startedOn);
                    release.finishTime = new Date(row.completedOn);
                    release.status = row.deploymentStatus;
                    release.URL = row.release._links.web.href;
                    if (row.release.artifacts.length > 0) {
                        release.imageVersion = row.release.artifacts[0].definitionReference.version.id;
                        release.registryURL = row.release.artifacts[0].definitionReference.registryurl.id;
                        release.registryResourceGroup = row.release.artifacts[0].definitionReference.resourcegroup.id;
                    }
                    releases.push(release);
                    this.releases[release.id] = release;
                }

                resolve();
                if (callback) {
                    callback(this.releases);
                }
            });
        });
    }

    private getBuildUrl(buildIds?: Set<string>) {
        if (buildIds) {
            let strBuildIds = "";
            buildIds.forEach((buildId) => {
                strBuildIds += buildId + ",";
            });
            return buildFilterUrl.replace("{buildIds}", strBuildIds);
        }

        return baseBuildUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    }
    private getReleaseUrl(releaseIds?: Set<string>) {
        if (releaseIds) {
            let strBuildIds = "";
            releaseIds.forEach((releaseId) => {
                strBuildIds += releaseId + ",";
            });
            return buildFilterUrl.replace("{buildIds}", strBuildIds);
        }

        return baseReleaseUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    }
}

export default AzureDevOpsPipeline;