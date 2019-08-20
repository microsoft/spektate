import { Author } from './Author';
import { Tag } from './Tag';

export abstract class Repository {
    public manifestSync: Tag;
    public abstract getManifestSyncState(callback: (syncTag: Tag) => void): Promise<void>;
    public abstract getAuthor(commitId: string, callback?: (author: Author) => void): Promise<void>;
}