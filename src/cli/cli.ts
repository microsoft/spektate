#!/usr/bin/env ts-node

import program = require('commander');
import { config } from '../config';
import { AccessHelper } from './AccessHelper';


program
  .version('0.1.0')

program
  .command('init')
  .description('Initialize container journey for the first time')
  .option('--azure-org <azure-org>', 'Organization under which the project lives in Azure')
  .option('--azure-project <azure-project>', 'Project under which pipeline lives in Azure')
  .option('--docker-pipeline-id <docker-pipeline-id>', 'Release Definition Id of the Docker to HLD Release')
  .option('--github-manifest <github-manifest>', 'Name of the Github Manifest repository')
  .option('--github-manifest-username <github-manifest-username>', 'Username of the Github account who owns manifest repository')
  .option('--hld-pipeline-id <hld-pipeline-id>', 'Build definition Id of the HLD to manifest pipeline')
  .option('--src-pipeline-id <src-pipeline-id', 'Build definition Id of the source to Docker pipeline')
  .option('--storage-account-key <storage-account-key>', 'Account Key for the storage table')
  .option('--storage-account-name <storage-account-name', 'Account name for the storage table')
  .option('--storage-partition-key <storage-partition-key>', 'Partition key in the storage table')
  .option('--storage-table-name <storage-table-name>', 'Name of the table in storage')
  .action((env, options) => {
    if (env.azureOrg && env.azureProject && env.dockerPipelineId && env.githubManifest && env.githubManifestUsername && env.hldPipelineId && env.srcPipelineId && env.storageAccountKey && env.storageAccountName && env.storagePartitionKey && env.storageTableName) {
        config.AZURE_ORG = env.azureOrg;
        config.AZURE_PROJECT = env.azureProject;
        config.DOCKER_PIPELINE_ID = env.dockerPipelineId;
        config.GITHUB_MANIFEST = env.githubManifest;
        config.GITHUB_MANIFEST_USERNAME = env.githubManifestUsername;
        config.HLD_PIPELINE_ID = env.hldPipelineId;
        config.SRC_PIPELINE_ID = env.srcPipelineId;
        config.STORAGE_ACCOUNT_KEY = env.storageAccountKey;
        config.STORAGE_ACCOUNT_NAME = env.storageAccountName;
        config.STORAGE_PARTITION_KEY = env.storagePartitionKey;
        config.STORAGE_TABLE_NAME = env.storageTableName;
        AccessHelper.writeConfigToFile(config);
    } else {
        console.log("You need to specify each of the config settings in order to run any command.");
    }
  });

program
  .command('deployments')
  .description('Get deployments')
  .option("-b, --build-id <build-id>", "Get deployments for a particular build Id from source repository")
  .option("-c, --commit-id <commit-id>", "Get deployments for a particular commit Id from source repository")
  .option("-i, --image-tag <image-tag>", "Get deployments for a particular image tag")
  .option("-e, --env <environment>", "Get deployments for a particular environment")
  .action((env, options) => {
      AccessHelper.verifyAppConfiguration();
      AccessHelper.getDeployments(env.env, env.imageTag, env.buildId, env.commitId);
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  $ deployments --id 4c3c2417ee78');
    console.log('  $ deployments --image-tag hello-bedrock-master-5429');
    console.log('  $ deployments --env Dev');
    console.log('  $ deployments --commit-id e3d6504');
  });;

program
  .command('cluster-sync')
  .description('Get commit Id to which the cluster is synced at')
  .action((env, options) => {
    AccessHelper.verifyAppConfiguration();
    AccessHelper.getClusterSync((syncCommit) => {
        console.log(syncCommit);
    });
  }).on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  $ cluster-sync');
  });

program
  .command('logs')
  .description('Get logs for a build/release')
  .option("-b, --build-id <build-id>", "Get logs for a build Id")
  .option("-r, --release-id <release-id>", "Get logs for a release Id")
  .action((env: any, options: any) => {
    AccessHelper.verifyAppConfiguration();
    AccessHelper.getLogs(env.buildId, env.releaseId)
  }).on("--help", () => {
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  $ logs -b 5477');
    console.log('  $ logs -r 140');
  });

program.parse(process.argv);
