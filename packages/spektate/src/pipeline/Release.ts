export interface IRelease {
  releaseName: string;
  id: string;
  imageVersion?: string;
  registryURL?: string;
  registryResourceGroup?: string;
  queueTime: Date;
  status: string;
  startTime: Date;
  finishTime: Date;
  URL: string;
}
