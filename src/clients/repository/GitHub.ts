class GitHub {
    public username: string;
    public reponame: string;

    constructor(username: string, reponame: string) {
        this.reponame = reponame;
        this.username = username;
    }

    public getCommits() {
        // TODO
    }
}