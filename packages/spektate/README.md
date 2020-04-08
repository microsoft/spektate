# Spektate

This library contains the modules that extract information from an Azure storage table containing deployments for [Bedrock](https://github.com/microsoft/bedrock)'s observability.

This is currently being used as a backend to [Spektate dashboard](https://github.com/microsoft/spektate) and [CLI](https://github.com/CatalystCode/spk) and can be extended to other applications.

## Getting started

To add this package to your project, run `yarn add spektate` or `npm install spektate` depending on your package manager.

To get a list of all deployments, run

```ts
const getPipeline = () => {
  return new AzureDevOpsPipeline(
    config.AZURE_ORG,
    config.AZURE_PROJECT,
    config.AZURE_PIPELINE_ACCESS_TOKEN
  );
};

const deployments: IDeployment[] = await getDeployments(
  config.STORAGE_ACCOUNT_NAME,
  config.STORAGE_ACCOUNT_KEY,
  config.STORAGE_TABLE_NAME,
  config.STORAGE_PARTITION_KEY,
  getPipeline(), // SRC pipeline
  getPipeline(), // ACR pipeline
  getPipeline(), // HLD pipeline
  undefined
);
```

To see examples of how this library is used, refer to code [here](https://github.com/microsoft/spektate/tree/master/src/backend).

## Development

1. Clone the project and run `yarn`.
2. Run `yarn build` to build the lib folder that contains all the built files
3. To publish a change, you must be logged into npm. Run `yarn publish` to publish a new version to this package.
