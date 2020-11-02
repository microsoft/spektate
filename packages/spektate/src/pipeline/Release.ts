export interface IRelease {
  releaseName: string;
  id: string;
  imageVersion?: string;
  registryURL?: string;
  registryResourceGroup?: string;
  queueTime: Date;
  status: string;
  result?: string;
  startTime: Date;
  finishTime: Date;
  URL: string;
  lastUpdateTime?: Date;
}
