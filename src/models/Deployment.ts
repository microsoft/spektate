
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
                        callback(deployments);
                    }
                }
        });
    }
    public deploymentId: string;
    public srcPipeline: Build;
    public acrPipeline?: Release;
    public hldPipeline?: Build;
    public commitId: string;
    public hldCommitId?: string;
    public imageTag: string;
    public timeStamp: string;

    constructor(deploymentId: string, srcPipeline: Build, commitId: string, hldCommitId: string, imageTag: string, timeStamp: string, acrPipeline?: Release, hldPipeline?: Build) {
        this.srcPipeline = srcPipeline;
        this.hldPipeline = hldPipeline;
        this.deploymentId = deploymentId;
        this.acrPipeline = acrPipeline;
        this.commitId = commitId;
        this.hldCommitId = hldCommitId;
        this.imageTag = imageTag;
        this.timeStamp = timeStamp;
    }
}