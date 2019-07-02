class AzureDevOpsRepo {
    public org: string;
    public project: string;
    public repo: string;

    constructor(org: string, project: string, repo: string) {
        this.org = org;
        this.project = project;
        this.repo = repo;
    }

    public getCommits() {
        // TODO
    }
}