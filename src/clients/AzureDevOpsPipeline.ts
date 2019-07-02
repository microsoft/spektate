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
        // TODO
    }
}