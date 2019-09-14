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
  getListOfBuilds: (buildIds?: Set<string>) => Promise<IBuilds>;
  getListOfReleases: (releaseIds?: Set<string>) => Promise<IReleases>;
}

export default IPipeline;
