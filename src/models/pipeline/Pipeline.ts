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
  public abstract getListOfBuilds(buildIds?: Set<string>): Promise<void>;
  public abstract getListOfReleases(releaseIds?: Set<string>): Promise<void>;
}

export default Pipeline;
