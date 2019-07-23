#!/usr/bin/env ts-node

// tslint:disable-next-line: no-var-requires
// import Deployment = require("src/models/Deployment");
import { config } from '../config';
import Deployment from '../models/Deployment';
import AzureDevOpsPipeline from '../models/pipeline/AzureDevOpsPipeline';
import { GitHub } from '../models/repository/GitHub';
import { Repository } from '../models/repository/Repository';

// tslint:disable-next-line: no-console
console.log('hey there!')

const srcPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.SRC_PIPELINE_ID);
srcPipeline.getListOfBuilds((srcBuilds) => {
    const hldPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.DOCKER_PIPELINE_ID, true);
    hldPipeline.getListOfReleases((hldReleases) => {
    const clusterPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.HLD_PIPELINE_ID);
    clusterPipeline.getListOfBuilds((clusterBuilds) => {
        const manifestRepo: Repository = new GitHub(config.GITHUB_MANIFEST_USERNAME, config.GITHUB_MANIFEST);
        manifestRepo.getManifestSyncState((syncCommit) => {
            // tslint:disable-next-line: no-console
            console.log(syncCommit);
        });
        Deployment.getDeployments(config.STORAGE_PARTITION_KEY, srcPipeline, hldPipeline, clusterPipeline, (deployments: Deployment[]) => {
            // tslint:disable-next-line: no-console
            // console.log(deployments);
        });
    });
    });
});