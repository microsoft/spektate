import { HttpHelper } from "./HttpHelper";

const baseUrl = "https://dev.azure.com/{organization}/{project}/_apis/build/builds/{buildId}?api-version=5.0";
  
class AzureDevOpsPipeline {
    public org: string;
    public project: string;
    public id: number;
    
    constructor(org: string, project: string, id: number) {
        this.org = org;
        this.project = project;
        this.id = id;
    }
    
    public getBuildLogs() {
        HttpHelper.httpGet(this.getUrl());
    }
    private getUrl() {
        return baseUrl.replace("{organization}", this.org).replace("{project}", this.project).replace("{buildId}", this.id + '');
    }
}

export default AzureDevOpsPipeline;