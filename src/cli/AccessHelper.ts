
import Table = require('cli-table');
import * as fs from 'fs';
import open = require('open');
import * as os from 'os';
import { Tag } from 'src/models/repository/Tag';
import { config } from '../config';
import Deployment from '../models/Deployment';
import AzureDevOpsPipeline from '../models/pipeline/AzureDevOpsPipeline';
import Pipeline from '../models/pipeline/Pipeline';
import { Author } from '../models/repository/Author';
import { GitHub } from '../models/repository/GitHub';
import { Repository } from '../models/repository/Repository';
import { OUTPUT_FORMAT } from './cli';

let hldPipeline: Pipeline;
let clusterPipeline: Pipeline;
let srcPipeline: Pipeline;
const fileLocation = os.homedir() + "/.ContainerJourney";

export class AccessHelper {

    public static initializePipelines() {
        srcPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.SRC_PIPELINE_ID, false, config.AZURE_PIPELINE_ACCESS_TOKEN);
        hldPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.DOCKER_PIPELINE_ID, true, config.AZURE_PIPELINE_ACCESS_TOKEN);
        clusterPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.HLD_PIPELINE_ID, false, config.AZURE_PIPELINE_ACCESS_TOKEN);
    }

    public static getAuthorForCommitOrBuild(commitId?: string, buildId?: string, callback?: ((author?: Author) => void)) {
        Deployment.getDeploymentsBasedOnFilters(config.STORAGE_PARTITION_KEY, srcPipeline, hldPipeline, clusterPipeline, undefined, undefined, buildId, commitId, (deployments: Deployment[]) => {
            if (deployments.length > 0 && callback) {
                deployments[0].fetchAuthor(callback);
            } else if(callback) {
                callback(undefined);
            }
        });
    }
    public static verifyAppConfiguration = (callback?: () => void) => {
        if (config.STORAGE_TABLE_NAME === "" || config.STORAGE_PARTITION_KEY === "" || config.STORAGE_ACCOUNT_NAME === "" || config.STORAGE_ACCOUNT_KEY === "" || config.SRC_PIPELINE_ID === 0 || config.HLD_PIPELINE_ID === 0 || config.GITHUB_MANIFEST_USERNAME === "" || config.MANIFEST === "" || config.DOCKER_PIPELINE_ID === undefined || config.AZURE_PROJECT === "" || config.AZURE_ORG === "") {
            AccessHelper.configureAppFromFile(callback);
        } else {
            AccessHelper.initializePipelines();
            if (callback) {
                callback();
            }
        }
    }

    public static configureAppFromFile = (callback?: () => void) => {
        fs.readFile(fileLocation, (error, data) => {
            if (error) {
                console.log(error);
            }
            const array = data.toString().split('\n');
            array.forEach((row: string) => {
                const key = row.split(/=(.+)/)[0];
                const value = row.split(/=(.+)/)[1];
                config[key] = value;
            });
            AccessHelper.initializePipelines();
            if (callback) {
                callback();
            }
        });
    }

    public static writeConfigToFile = (configMap: any) => {
        let data = "";
        Object.keys(configMap).forEach((key) => {
            data += "\n" + key + "=" + configMap[key];
        })
        fs.writeFile(fileLocation, data, (error: any) => {
            if (error) {
                console.log(error);
            }
        });
    }

    public static getClusterSync = (callback?: (syncTag: Tag) => void): void => {
        const manifestRepo: Repository = new GitHub(config.GITHUB_MANIFEST_USERNAME, config.MANIFEST, config.MANIFEST_ACCESS_TOKEN);
        manifestRepo.getManifestSyncState((syncTag) => {
            if (callback) {
                callback(syncTag);
            }
        });
    }

    // TODO: Once the bug with release API is fixed (regarding returning only top 50 rows),
    // improve the below and move it into models
    public static getLogs = (buildId: string, releaseId: string) => {
        if (buildId !== undefined && buildId !== "") {
            const p1 = srcPipeline.getListOfBuilds();
            const p2 = clusterPipeline.getListOfBuilds();
            Promise.all([p1, p2]).then(async () => {
                if (buildId in srcPipeline.builds) {
                    console.log("Navigating to: " + srcPipeline.builds[buildId].URL);
                    await open(srcPipeline.builds[buildId].URL);
                } else if (buildId in clusterPipeline.builds) {
                    console.log("Navigating to: " + clusterPipeline.builds[buildId].URL);
                    await open(clusterPipeline.builds[buildId].URL);
                } else {
                    console.log("Unable to find build for " + buildId);
                }
            });
        } else if (releaseId !== undefined && releaseId !== "") {
            hldPipeline.getListOfReleases().then(async () => {
                if (releaseId in hldPipeline.releases) {
                    console.log("Navigating to: " + hldPipeline.releases[releaseId].URL);
                    await open(hldPipeline.releases[releaseId].URL);
                } else {
                    console.log("Unable to find release for " + releaseId);
                }
            });
        } else {
            console.log("One of build-id or release-id need to be specified.");
        }
    }

    public static getDeployments = (outputFormat: OUTPUT_FORMAT, environment?: string, imageTag?: string, p1Id?: string, commitId?: string) => {
        Deployment.getDeploymentsBasedOnFilters(config.STORAGE_PARTITION_KEY, srcPipeline, hldPipeline, clusterPipeline, environment, imageTag, p1Id, commitId, (deployments: Deployment[]) => {
            if (outputFormat === OUTPUT_FORMAT.JSON) {
                console.log(JSON.stringify(deployments));
            } else {
                AccessHelper.printDeployments(deployments, outputFormat);
            }
        });
    }

    public static printDeployments = (deployments: Deployment[], outputFormat: OUTPUT_FORMAT) => {
        if (deployments.length > 0) {
            let row = [];
            row.push("Start Time");
            row.push("Commit");
            row.push("Src to ACR");
            row.push("Image Tag");
            row.push("Result");
            row.push("ACR to HLD");
            row.push("Env");
            row.push("Hld Commit");
            row.push("Result");
            row.push("HLD to Manifest");
            row.push("Result");
            if (outputFormat === OUTPUT_FORMAT.WIDE) {
                row.push("Duration");
                row.push("Status");
                row.push("Manifest Commit");
                row.push("End Time");
            }
            const table = new Table({head: row});
            deployments.forEach((deployment) => {
                row = [];
                row.push(deployment.srcToDockerBuild ? deployment.srcToDockerBuild.startTime.toLocaleString() : "");
                row.push(deployment.commitId);
                row.push(deployment.srcToDockerBuild ? deployment.srcToDockerBuild.id : "");
                row.push(deployment.imageTag);
                row.push(deployment.srcToDockerBuild ? AccessHelper.getStatus(deployment.srcToDockerBuild.result) : "");
                row.push(deployment.dockerToHldRelease ? deployment.dockerToHldRelease.id : "");
                row.push(deployment.environment.toUpperCase());
                row.push(deployment.hldCommitId);
                row.push(deployment.dockerToHldRelease ? AccessHelper.getStatus(deployment.dockerToHldRelease.status) : "");
                row.push(deployment.hldToManifestBuild ? deployment.hldToManifestBuild.id : "");
                row.push(deployment.hldToManifestBuild ? AccessHelper.getStatus(deployment.hldToManifestBuild.result) : "");
                if (outputFormat === OUTPUT_FORMAT.WIDE) {
                    row.push(deployment.duration() + " mins");
                    row.push(deployment.status());
                    row.push(deployment.manifestCommitId);
                    row.push(deployment.hldToManifestBuild && deployment.hldToManifestBuild.finishTime && !isNaN(deployment.hldToManifestBuild.finishTime.getTime()) ? deployment.hldToManifestBuild.finishTime.toLocaleString() : "");
                }
                table.push(row);
            });

            console.log(table.toString());
        } else {
            console.log("No deployments found for specified filters.");
        }
    }

    public static getStatus = ( status: string) => {
        if (status === "succeeded") {
            return '\u2713';
        } else if (!status) {
            return "...";
        }
        return '\u0445';
    }
}
