import { IBuild } from "./Build";
import { IRelease } from "./Release";
export interface IBuilds {
  [buildId: string]: IBuild;
}
export interface IReleases {
  [releaseId: string]: IRelease;
}

export interface IPipeline {
  builds: IBuilds;
  releases: IReleases;
  getListOfBuilds: (
    callback?: (data: any) => void,
    buildIds?: Set<string>
  ) => Promise<void>;
  getListOfReleases: (
    callback?: (data: any) => void,
    releaseIds?: Set<string>
  ) => Promise<void>;
}

export default IPipeline;
