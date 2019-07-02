class AzureDevOpsPipeline {
    org: string;
    project: string;
    id: number;

    constructor(org: string, project: string, id: number) {
        this.org = org;
        this.project = project;
        this.id = id;
    }

    getBuildLogs() {
        // TODO
    }
}