import { HttpHelper } from "../HttpHelper";
import { GitHub } from '../repository/GitHub';
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
    
    constructor(org: string, project: string, definitionId: number, isRelease?: boolean) {
        super();
        this.org = org;
        this.project = project;
        this.definitionId = definitionId;
        this.isRelease = isRelease;

        if (!isRelease) {
            this.getListOfBuilds();
        } else {
            this.getListOfReleases();
        }
    }

    public getListOfBuilds() {
        const listOfBuilds = HttpHelper.httpGet(this.getBuildUrl());
        const json = JSON.parse(listOfBuilds);
        const builds: Build[] = [];
        for (const row of json.value) {
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
    }

    public getListOfReleases() {
        const listOfBuilds = HttpHelper.httpGet(this.getReleaseUrl());
        const json = JSON.parse(listOfBuilds);
        const releases: Release[] = [];
        for (const row of json.value) {
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
    }
    private getBuildUrl() {
        return baseBuildUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    }
    private getReleaseUrl() {
        return baseReleaseUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    }
}

export default AzureDevOpsPipeline;