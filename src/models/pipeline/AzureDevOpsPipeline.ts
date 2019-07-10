import { HttpHelper } from "../HttpHelper";
import { Build } from "./Build";
import Pipeline from "./Pipeline";
import { Release } from "./Release";

const baseBuildUrl = "https://dev.azure.com/{organization}/{project}/_apis/build/builds?definitions={definitionId}&api-version=5.0&queryOrder=startTimeDescending";
const baseReleaseUrl = "https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/deployments?api-version=5.0&definitionId={definitionId}&queryOrder=startTimeDescending";
class AzureDevOpsPipeline extends Pipeline {
    // User defined fields
    public org: string;
    public project: string;
    public definitionId: number;
    public isRelease?: boolean;
    public builds: Build[];
    public releases: Release[];
    
    constructor(org: string, project: string, definitionId: number, isRelease?: boolean) {
        super();
        this.org = org;
        this.project = project;
        this.definitionId = definitionId;
        this.isRelease = isRelease;
    }

    public getListOfBuilds(): Build[] {
        const listOfBuilds = HttpHelper.httpGet(this.getBuildUrl());
        const json = JSON.parse(listOfBuilds);
        const builds: Build[] = [];
        for (const row of json.value) {
            const build = new Build();
            build.author = row.requestedFor.displayName;
            build.buildNumber = row.buildNumber;
            build.id = row.id;
            build.queueTime = row.queueTime;
            build.sourceBranch = row.sourceBranch;
            build.status = row.status;
            build.startTime = row.startTime;
            build.URL = row._links.web.href;
            build.result = row.result;
            build.sourceVersion = row.sourceVersion;
            build.sourceVersionURL = row._links.sourceVersionDisplayUri.href;
            // tslint:disable-next-line:no-console
            // console.log(build);
            builds.push(build);
        }
        this.builds = builds;
        return builds;
    }

    public getListOfReleases(): Release[] {
        const listOfBuilds = HttpHelper.httpGet(this.getReleaseUrl());
        const json = JSON.parse(listOfBuilds);
        const releases: Release[] = [];
        for (const row of json.value) {
            const release = new Release();
            release.id = row.id;
            release.queueTime = row.queuedOn;
            release.startTime = row.startedOn;
            release.completeTime = row.completedOn;
            release.status = row.deploymentStatus;
            release.URL = row.release._links.web.href;
            if (row.release.artifacts.length > 0) {
                release.imageVersion = row.release.artifacts[0].definitionReference.version.id;
                release.registryURL = row.release.artifacts[0].definitionReference.registryurl.id;
                release.registryResourceGroup = row.release.artifacts[0].definitionReference.resourcegroup.id;
            }
            // tslint:disable-next-line:no-console
            console.log(release);
            releases.push(release);
        }
        this.releases = releases;
        return releases;
    }
    private getBuildUrl() {
        return baseBuildUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    }
    private getReleaseUrl() {
        return baseReleaseUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    }
}

export default AzureDevOpsPipeline;