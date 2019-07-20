import { Author } from './Author';

export abstract class Repository {
    public manifestSync: string;
    public abstract getManifestSyncState(): void;
    public abstract getAuthor(commitId: string): Author | undefined;
}