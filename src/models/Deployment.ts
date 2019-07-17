
import * as azure from 'azure-storage';
import {config} from "../config";
import { Build } from "./pipeline/Build";
import Pipeline from './pipeline/Pipeline';
import { Release } from './pipeline/Release';

export default class Deployment {

    public static async getDeployments(partitionKey: string, srcPipeline: Pipeline, hldPipeline: Pipeline, manifestPipeline: Pipeline, callback?: (deployments: Deployment[]) => void) {
        
        const tableService = azure.createTableService(config.STORAGE_ACCOUNT_NAME, config.STORAGE_ACCOUNT_KEY);
        // Disabling ts-lint on line below, to get around issue https://github.com/Azure/azure-storage-node/issues/545
        // tslint:disable-next-line
        let nextContinuationToken: azure.TableService.TableContinuationToken = <any>null;
        const deployments: Deployment[] = [];

        // TODO: Look into cleaning up the parsing code below (avoid parsing underscores).
        tableService.queryEntities(config.STORAGE_TABLE_NAME, 
            new azure.TableQuery().where("PartitionKey eq '" +  partitionKey + "'"),
            nextContinuationToken,
                (error: any, result: any) => {
                if (!error) {
                    // tslint:disable-next-line:no-console
                    console.log(result.entries);
                    for(const entry of result.entries) {
                        const p1: Build = srcPipeline.builds[entry.p1._];

                        let p2;
                        let hldCommitId = "";
                        if (entry.p2 != null) {
                            p2 = hldPipeline.releases[entry.p2._];
                            if (entry.hldCommitId != null) {
                                hldCommitId = entry.hldCommitId._;
                            }
                        }
                        let p3;
                        if (entry.p3 != null) {
                            p3 = manifestPipeline.builds[entry.p3._];
                        }

                        const deployment = new Deployment(entry.RowKey._, p1, entry.commitId._,hldCommitId, entry.imageTag._, entry.Timestamp._, p2, p3);
                        deployments.push(deployment);
                    }
                    if (callback) {
                        deployments.sort(Deployment.compare);
                        callback(deployments);
                    }
                }
        });
    }

    public static compare(a: Deployment, b: Deployment) {
        let aInt = Number(a.srcToDockerBuild.id);
        let bInt = Number(b.srcToDockerBuild.id);
        if (aInt < bInt) {
            return 1;
        } else if (aInt > bInt) {
            return -1;
        }
        if (a.dockerToHldRelease != null && b.dockerToHldRelease != null) {
            aInt = Number(a.dockerToHldRelease.id);
            bInt = Number(b.dockerToHldRelease.id);
            if (aInt < bInt) {
                return 1;
            } else if (aInt > bInt) {
                return -1;
            }
        }

        if (a.hldToManifestBuild != null && b.hldToManifestBuild != null) {
            aInt = Number(a.hldToManifestBuild.id);
            bInt = Number(b.hldToManifestBuild.id);
            if (aInt < bInt) {
                return 1;
            } else if (aInt > bInt) {
                return -1;
            }
        }

        return 0;
    }
    public deploymentId: string;
    public srcToDockerBuild: Build;
    public dockerToHldRelease?: Release;
    public hldToManifestBuild?: Build;
    public commitId: string;
    public hldCommitId?: string;
    public imageTag: string;
    public timeStamp: string;

    constructor(deploymentId: string, srcToDockerBuild: Build, commitId: string, hldCommitId: string, imageTag: string, timeStamp: string, dockerToHldRelease?: Release, hldToManifestBuild?: Build) {
        this.srcToDockerBuild = srcToDockerBuild;
        this.hldToManifestBuild = hldToManifestBuild;
        this.deploymentId = deploymentId;
        this.dockerToHldRelease = dockerToHldRelease;
        this.commitId = commitId;
        this.hldCommitId = hldCommitId;
        this.imageTag = imageTag;
        this.timeStamp = timeStamp;
    }

    public duration(): string {
        let duration = this.srcToDockerBuild.finishTime.valueOf() - this.srcToDockerBuild.queueTime.valueOf();
        if (this.dockerToHldRelease != null) {
            duration += this.dockerToHldRelease.finishTime.valueOf() - this.dockerToHldRelease.queueTime.valueOf();
        }
        if (this.hldToManifestBuild != null) {
            duration += this.hldToManifestBuild.finishTime.valueOf() - this.hldToManifestBuild.queueTime.valueOf();
        }
        
        return Number(duration/60000).toFixed(2);
    }

    public status(): string {
        if (this.srcToDockerBuild.status === "completed" && (this.hldToManifestBuild ? this.hldToManifestBuild.status === "completed" : false) && (this.dockerToHldRelease ? this.dockerToHldRelease.status === "succeeded" || this.dockerToHldRelease.status === "failed" : false)) {
            return "Complete";
        }
        return "In Progress";
    }
}