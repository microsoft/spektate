import { HttpHelper } from "../HttpHelper";
import { Build } from "./Build";
import Pipeline from "./Pipeline";

const baseUrl = "https://dev.azure.com/{organization}/{project}/_apis/build/builds?definitions={definitionId}&api-version=5.0&queryOrder=startTimeDescending";
  
class AzureDevOpsPipeline extends Pipeline {
    // User defined fields
    public org: string;
    public project: string;
    public definitionId: number;

    
    constructor(org: string, project: string, definitionId: number) {
        super();
        this.org = org;
        this.project = project;
        this.definitionId = definitionId;
    }
    
    public getRawListOfBuilds() {
        return HttpHelper.httpGet(this.getUrl());
    }

    public getListOfBuilds(): Build[] {
        const listOfBuilds = this.getRawListOfBuilds();

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
            // tslint:disable-next-line:no-console
            console.log(build);
            builds.push(build);
        }
        return builds;
    }
    private getUrl() {
        return baseUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    }
}

export default AzureDevOpsPipeline;