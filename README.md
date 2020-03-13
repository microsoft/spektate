[![Build Status](https://dev.azure.com/epicstuff/bedrock/_apis/build/status/microsoft.spektate?branchName=master)](https://dev.azure.com/epicstuff/bedrock/_build/latest?definitionId=124&branchName=master)
![Azure DevOps coverage](https://img.shields.io/azure-devops/coverage/epicstuff/bedrock/124/master)

# Spektate

This is an initiative to visualize [Project Bedrock](https://github.com/microsoft/bedrock). Spektate ties in information from the repositories API, the pipelines API and information stored in an Azure Table to display the dashboard with the following components:

![](./images/spektate-pieces-diagram.png)

Here's a detailed diagram describing the Spektate workflow. Each pipeline is responsible for sending a unique set of data to the storage, which is used to connect all the pieces together:

![](./images/spektate-workflow.png)

Currently, Spektate consists of a command line interface and a simple dashboard prototype. The instructions to use both are below.

Note: Spektate dashboard will delete deployments when their corresponding builds/releases have expired in Azure DevOps.

## Onboard a Bedrock project to use Spektate

Follow the steps in this [guide](https://github.com/CatalystCode/spk/blob/master/docs/service-introspection-onboarding.md) to onboard a project to use Spektate.

## Install on your cluster

The helm chart to use this dashboard is located [here](./chart). There's a Load Balancer provided in the helm chart but it's turned off in `values.yaml` with the setting `externalIP`. Set this to true if you would like to expose the dashboard via a public endpoint.

Substitute values for your configuration and install this dashboard via the command below:

```bash
cd ./chart
helm install . --name spektate --set storageAccessKey=<storageAccessKey> --set storageTableName=<storageTableName> --set storagePartitionKey=<storagePartitionKey> --set storageAccountName=<storageAccountName> --set pipelineProject=<pipelineProjectName> --set pipelineOrg=<pipelineOrg> --set pipelineAccessToken=<PipelinePAT> --set manifest=<manifestRepoName> --set manifestAccessToken=<manifestAccessToken> --set githubManifestUsername=<gitHubUserName>  --set sourceRepoAccessToken=<sourceRepoAccessToken>
```

- `storageAccessKey`: Access key for the storage account
- `storageTableName`: Table name for the storage account
- `storagePartitionKey`: Partition key for your configuration, you may want to use project name or some identifier that helps separate unrelated configurations for the purpose of introspection.
- `storageAccountName`: Storage account name
- `pipelineProject`: Project name for the pipelines in Azure DevOps
- `pipelineOrg`: Org name for the pipelines in Azure DevOps
- `pipelineAccessToken`: Access token for pipelines in Azure DevOps
- `manifestRepoName`: Manifest repository name
- `manifestAccessToken`: Access token for the manifest repository
- `sourceRepoAccessToken`: Access token for the source repository
- **Note**: If you're using GitHub, add `githubManifestUsername`: Account name or organization name under which the manifest repository resides.

If you're not using an external IP, use port-forwarding to access the dashboard:

1. Copy pod name from `kubectl get pods`
2. `kubectl port-forward pod/spektate-spektate-6f6cb98f58-l5gw4 2200:5000` or change `2200` to a port of your choice
3. Navigate to http://localhost:2200 or change `2200` to a port of your choice

## Dashboard dev mode

1. Clone this repository, and run `yarn`.
2. Add the following env variables to your shell:

   ```bash
   export REACT_APP_STORAGE_ACCESS_KEY=
   export REACT_APP_STORAGE_TABLE_NAME=
   export REACT_APP_STORAGE_PARTITION_KEY=
   export REACT_APP_STORAGE_ACCOUNT_NAME=
   export REACT_APP_PIPELINE_PROJECT=
   export REACT_APP_PIPELINE_ORG=
   export REACT_APP_PIPELINE_ACCESS_TOKEN=
   export REACT_APP_MANIFEST=
   export REACT_APP_MANIFEST_ACCESS_TOKEN=
   export REACT_APP_SOURCE_REPO_ACCESS_TOKEN=
   ```

   - `REACT_APP_STORAGE_ACCESS_KEY`: Access key for the storage account
   - `REACT_APP_STORAGE_TABLE_NAME`: Table name for the storage account
   - `REACT_APP_STORAGE_PARTITION_KEY`: Partition key for your configuration, you may want to use project name or some identifier that helps separate unrelated configurations for the purpose of introspection.
   - `REACT_APP_STORAGE_ACCOUNT_NAME`: Storage account name
   - `REACT_APP_PIPELINE_PROJECT`: Project name for the pipelines in Azure DevOps
   - `REACT_APP_PIPELINE_ORG`: Org name for the pipelines in Azure DevOps
   - `REACT_APP_PIPELINE_ACCESS_TOKEN`: Access token for pipelines in Azure DevOps
   - `REACT_APP_MANIFEST`: Manifest repository name
   - `REACT_APP_MANIFEST_ACCESS_TOKEN`: Access token for the manifest repository
   - `REACT_APP_SOURCE_REPO_ACCESS_TOKEN`: Access token for the source repository
   - **Note**: If you're using GitHub, add `REACT_APP_GITHUB_MANIFEST_USERNAME`: Account name or organization name under which the manifest repository resides.

3. Then run `yarn start-backend` in one window to start the backend server, and `yarn start` in another to start the front end to view the dashboard for the hello world deployment screen!

## Command Line Interface

To use the CLI for Spektate, head over to https://github.com/catalystcode/spk.

# Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
