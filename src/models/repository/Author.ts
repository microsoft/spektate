export class Author {
    public URL: string;
    public name: string;
    public username: string;

    constructor(URL: string, name: string, username: string) {
        this.username = username;
        this.name = name;
        this.URL = URL;
    }
}