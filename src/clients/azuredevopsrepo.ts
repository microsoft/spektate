class AzureDevOpsRepo {
    org: string;
    project: string;
    repo: string;

    constructor(org: string, project: string, repo: string) {
        this.org = org;
        this.project = project;
        this.repo = repo;
    }

    getCommits() {
        // TODO
    }
}