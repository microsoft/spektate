import { HttpHelper } from "./HttpHelper";

const baseUrl = "https://dev.azure.com/{organization}/{project}/_apis/build/builds?definitions={definitionId}&api-version=5.0&queryOrder=startTimeDescending";
  
class AzureDevOpsPipeline {
    public org: string;
    public project: string;
    public definitionId: number;
    
    constructor(org: string, project: string, definitionId: number) {
        this.org = org;
        this.project = project;
        this.definitionId = definitionId;
    }
    
    public getListOfBuilds() {
        return HttpHelper.httpGet(this.getUrl());
    }
    private getUrl() {
        return baseUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{definitionId}", this.definitionId + '');
    }
}

export default AzureDevOpsPipeline;