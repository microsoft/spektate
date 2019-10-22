[![Build Status](https://dev.azure.com/epicstuff/bedrock/_apis/build/status/microsoft.spektate?branchName=master)](https://dev.azure.com/epicstuff/bedrock/_build/latest?definitionId=124&branchName=master)

# Spektate

This is an initiative to visualize [Project Bedrock](https://github.com/microsoft/bedrock). Here's a high level diagram describing the Spektate workflow:

![](./images/spektate-workflow.png)

Currently, Spektate consists of a command line interface and a simple dashboard prototype. The instructions to use both are below.

## Onboard a Bedrock project to use Spektate

Follow the steps in this [guide](https://github.com/CatalystCode/spk/blob/master/docs/service-introspection-onboarding.md) to onboard a project to use Spektate.  

## Dashboard prototype

1. Clone this repository, and run `npm install`.
2. Make sure the file located in `src/config.ts` is updated with the config values.
3. Then run `npm start` to view the dashboard for the hello world deployment screen.

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
