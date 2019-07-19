export abstract class Repository {
    public manifestSync: string;
    public abstract getManifestSyncState(): void;
}