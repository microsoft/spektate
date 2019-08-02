#!/usr/bin/env ts-node

import program = require('commander');
import { config } from '../config';
import { AccessHelper } from './AccessHelper';

program
  .version('0.1.0')
  .option('-C, --chdir <path>', 'change the working directory')
  .option('-c, --config <path>', 'set config path. defaults to ./deploy.conf')
  .option('-T, --no-tests', 'ignore test hook');

program
  .command('deployments')
  .description('Get deployments')
  .option("-b, --build-id <build-id>", "Get deployments for a particular build Id from source repository")
  .option("-c, --commit-id <commit-id>", "Get deployments for a particular commit Id from source repository")
  .option("-i, --image-tag <image-tag>", "Get deployments for a particular image tag")
  .option("-e, --env <environment>", "Get deployments for a particular environment")
  .action((env, options) => {
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
    AccessHelper.getLogs(env.buildId, env.releaseId)
  }).on("--help", () => {
    console.log('');
    console.log('Examples:');
    console.log('');
    console.log('  $ logs 5477');
  });

program.parse(process.argv);
