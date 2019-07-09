import { HttpHelper } from "../HttpHelper";
import { Build } from "./Build";
import Pipeline from "./Pipeline";
import { Release } from "./Release";

const baseBuildUrl = "https://dev.azure.com/{organization}/{project}/_apis/build/builds?definitions={definitionId}&api-version=5.0&queryOrder=startTimeDescending";
// const baseReleaseUrl = "https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/deployments?api-version=5.0&definitionId={definitionId}&queryOrder=startTimeDescending";
class AzureDevOpsPipeline extends Pipeline {
    // User defined fields
    public org: string;
    public project: string;
    public definitionId: number;
    // public isRelease: boolean;

    
    constructor(org: string, project: string, definitionId: number) {
        super();
        this.org = org;
        this.project = project;
        this.definitionId = definitionId;
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
            // tslint:disable-next-line:no-console
            console.log(build);
            builds.push(build);
        }
        return builds;
    }

    public getListOfReleases(): Release[] {
        return [];
    }
    private getBuildUrl() {
        return baseBuildUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    }
    // private getReleaseUrl() {
    //     return baseReleaseUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    // }
}

export default AzureDevOpsPipeline;