export class Tag {
    public commit: string;
    public date: Date;
    public tagger?: string;
    public message?: string;

    constructor(commit: string, date: Date, tagger?: string, message?: string) {
        this.commit = commit;
        this.date = date;
        this.tagger = tagger;
        this.message = message;
    }
}