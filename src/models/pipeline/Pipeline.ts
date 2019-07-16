import { Build } from "./Build";
import { Release } from "./Release";
export interface IBuilds {
    [buildId: string]: Build;
}
export interface IReleases {
    [releaseId: string]: Release;
}

abstract class Pipeline {

    public builds: IBuilds = {};
    public releases: IReleases = {};
    public abstract getListOfBuilds(): void;
    public abstract getListOfReleases(): void;
}

export default Pipeline;