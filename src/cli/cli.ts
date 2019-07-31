#!/usr/bin/env ts-node

import Progress = require('cli-progress');
import Table = require('cli-table');
import program = require('commander');
import { config } from '../config';
import Deployment from '../models/Deployment';
import AzureDevOpsPipeline from '../models/pipeline/AzureDevOpsPipeline';
import { GitHub } from '../models/repository/GitHub';
import { Repository } from '../models/repository/Repository';

program
  .version('0.1.0')
  .option('-C, --chdir <path>', 'change the working directory')
  .option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
  .option('-T, --no-tests', 'ignore test hook');

program
  .command('deployments')
  .description('Get deployments')
//   .option("-a, --author <author>", "Get deployments for a particular author")
  .option("-b, --build-id <build-id>", "Get deployments for a particular build Id from source repository")
  .option("-c, --commit-id <commit-id>", "Get deployments for a particular commit Id from source repository")
  .option("-i, --image-tag <image-tag>", "Get deployments for a particular image tag")
  .option("-e, --env <environment>", "Get deployments for a particular environment")
  .action((env, options) => {
    // tslint:disable-next-line: no-console
    // console.log(env);
    // tslint:disable-next-line: no-console
    // console.log(options)
    // tslint:disable-next-line: no-console
    // console.log(env.author);
    getDeployments(env.env, env.imageTag, env.buildId, env.commitId);
  })
  .on('--help', () => {
    // tslint:disable-next-line: no-console
    console.log('');
    // tslint:disable-next-line: no-console
    console.log('Examples:');
    // tslint:disable-next-line: no-console
    console.log('');
    // tslint:disable-next-line: no-console
    // console.log('  $ deployments --author samiya');
    // tslint:disable-next-line: no-console
    console.log('  $ deployments --id 4c3c2417ee78');
    // tslint:disable-next-line: no-console
    console.log('  $ deployments --image-tag hello-bedrock-master-5429');
    // tslint:disable-next-line: no-console
    console.log('  $ deployments --env Dev');
    // tslint:disable-next-line: no-console
    console.log('  $ deployments --commit-id e3d6504');
  });;

program
  .command('*')
  .action((env) => {
    // tslint:disable-next-line: no-console
    console.log('You asked for "%s"', env);
  });

program.parse(process.argv);

function getDeployments(environment?: string, imageTag?: string, p1Id?: string, commitId?: string) {
    const srcPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.SRC_PIPELINE_ID);
    const progressBar = new Progress.Bar({}, Progress.Presets.shades_classic);
    progressBar.start(100, 0);

    srcPipeline.getListOfBuilds((srcBuilds) => {
        progressBar.update(25);
        const hldPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.DOCKER_PIPELINE_ID, true);

        hldPipeline.getListOfReleases((hldReleases) => {
            progressBar.update(50);
            const clusterPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.HLD_PIPELINE_ID);

            clusterPipeline.getListOfBuilds((clusterBuilds) => {
                progressBar.update(75);
                const manifestRepo: Repository = new GitHub(config.GITHUB_MANIFEST_USERNAME, config.GITHUB_MANIFEST);

                manifestRepo.getManifestSyncState((syncCommit) => {
                    // progressBar.update(100);
                    // tslint:disable-next-line: no-console
                    console.log("Cluster synced at: " + syncCommit);
                });
                Deployment.getDeploymentsBasedOnFilters(config.STORAGE_PARTITION_KEY, srcPipeline, hldPipeline, clusterPipeline, environment, imageTag, p1Id, commitId, (deployments: Deployment[]) => {
                    progressBar.update(100);
                    progressBar.stop();
                    if (deployments.length > 0) {
                        let row = [];
                        row.push("P1");
                        row.push("CommitId");
                        row.push("P2");
                        row.push("HldCommitId");
                        row.push("Environment");
                        row.push("Image Tag");
                        row.push("P3");
                        row.push("ManifestCommitId");
                        const table = new Table({head: row});
                        deployments.forEach((deployment) => {
                            row = [];
                            row.push(deployment.srcToDockerBuild ? deployment.srcToDockerBuild.id : "");
                            row.push(deployment.commitId);
                            row.push(deployment.dockerToHldRelease ? deployment.dockerToHldRelease.id : "");
                            row.push(deployment.hldCommitId);
                            row.push(deployment.environment);
                            row.push(deployment.imageTag);
                            row.push(deployment.hldToManifestBuild ? deployment.hldToManifestBuild.id : "");
                            row.push(deployment.manifestCommitId);
                            table.push(row);
                        });

                        // tslint:disable-next-line: no-console
                        console.log(table.toString());
                    } else {
                        // tslint:disable-next-line: no-console
                        console.log("No deployments found for specified filters.");
                    }
                    
                }); 
            });
        });
    });

}