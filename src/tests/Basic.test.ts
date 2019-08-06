
import { expect } from 'chai';
import 'mocha';
import { AccessHelper } from '../cli/AccessHelper';
import { config } from '../config';
import Deployment from '../models/Deployment';
import AzureDevOpsPipeline from '../models/pipeline/AzureDevOpsPipeline';
import { Author } from '../models/repository/Author';

describe('config validation', () => {
    it('should be configured', () => {
        AccessHelper.verifyAppConfiguration(() => {
            expect(config.SRC_PIPELINE_ID).to.not.equal(0);
            expect(config.HLD_PIPELINE_ID).to.not.equal(0);
            expect(config.DOCKER_PIPELINE_ID).to.not.equal(0);
            expect(config.AZURE_ORG.length).to.not.equal(0);
            expect(config.AZURE_PROJECT.length).to.not.equal(0);
            expect(config.GITHUB_MANIFEST.length).to.not.equal(0);
            expect(config.GITHUB_MANIFEST_USERNAME.length).to.not.equal(0);
            expect(config.STORAGE_ACCOUNT_KEY.length).to.not.equal(0);
            expect(config.STORAGE_ACCOUNT_NAME.length).to.not.equal(0);
            expect(config.STORAGE_PARTITION_KEY.length).to.not.equal(0);
            expect(config.STORAGE_TABLE_NAME.length).to.not.equal(0);
        });
    });
});

describe('cluster-sync', () => {
    it('should return the most recent sync tag', () => {
        AccessHelper.verifyAppConfiguration(() => {
            AccessHelper.getClusterSync((syncCommit) => {
                expect(syncCommit.length).to.equal(7);
            });
        });
    });
});

describe('author', () => {
    it('should return the right author', () => {
        AccessHelper.verifyAppConfiguration(() => {
            AccessHelper.getAuthorForCommitOrBuild('e3d6504', undefined, (author: Author) => {
                expect(author.username).equal("samiyaakhtar");
            });
        });
    });
});

describe('deployment', () => {
    it('should return a correct deployment on filter', () => {
        AccessHelper.verifyAppConfiguration(() => {
            const srcPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.SRC_PIPELINE_ID);
            const hldPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.DOCKER_PIPELINE_ID, true);
            const clusterPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.HLD_PIPELINE_ID);

            Deployment.getDeploymentsBasedOnFilters(config.STORAGE_PARTITION_KEY, srcPipeline, hldPipeline, clusterPipeline, "Staging", undefined, undefined, undefined, (deployments: Deployment[]) => {
                let found5432 = false;
                deployments.forEach((deployment) => {
                    if (deployment.srcToDockerBuild && deployment.srcToDockerBuild.id.toString() === "5432") {
                        found5432 = true;
                        expect(deployment.srcToDockerBuild.sourceVersion.substring(0,7)).to.equal("e3d6504");
                        expect(deployment.srcToDockerBuild.result).to.equal("succeeded");

                        if (deployment.dockerToHldRelease && deployment.dockerToHldRelease.id.toString() === "137") {
                            expect(deployment.dockerToHldRelease.imageVersion).to.equal("hello-bedrock-master-5432");
                            expect(deployment.dockerToHldRelease.id.toString()).to.equal("137");
                            expect(deployment.dockerToHldRelease.status).to.equal("succeeded");
                        }

                        if (deployment.hldToManifestBuild && deployment.hldToManifestBuild.id.toString() === "5433") {
                            expect(deployment.manifestCommitId).to.equal("801b241");
                            expect(deployment.hldToManifestBuild.id.toString()).to.equal("5433");
                            expect(deployment.hldToManifestBuild.result).to.equal("succeeded");
                        }
                        if (deployment.srcToDockerBuild.repository) {
                            deployment.srcToDockerBuild.repository.getAuthor(deployment.srcToDockerBuild.sourceVersion, (author: Author) => {
                                expect(author.username).to.equal("samiyaakhtar");
                            });
                        }
                    }
                });
                expect(found5432).to.equal(true);
                expect(deployments.length).to.greaterThan(0);
            });
        });
    });
});