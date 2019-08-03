
import { expect } from 'chai';
import 'mocha';
import { AccessHelper } from '../cli/AccessHelper';
import { config } from '../config';
import Deployment from '../models/Deployment';
import AzureDevOpsPipeline from '../models/pipeline/AzureDevOpsPipeline';

describe('config validation', () => {
    it('should be configured', () => {
        AccessHelper.verifyAppConfiguration();
        expect(config.SRC_PIPELINE_ID).to.not.equal(0);
    });
});

describe('cluster-sync', () => {
    it('should return the most recent sync tag', () => {
        AccessHelper.getClusterSync((syncCommit) => {
            expect(syncCommit.length).to.equal(7);
        });
    });
});

describe('deployments', () => {
    it('should return some deployments', () => {
        const srcPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.SRC_PIPELINE_ID);
        const hldPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.DOCKER_PIPELINE_ID, true);
        const clusterPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.HLD_PIPELINE_ID);

        Deployment.getDeployments(config.STORAGE_PARTITION_KEY, srcPipeline, hldPipeline, clusterPipeline, (deployments: Deployment[]) => {
            expect(deployments.length).to.greaterThan(0);
        });
    });
});