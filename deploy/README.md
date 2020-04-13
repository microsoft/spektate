# Continuous Deployment

## create-variable-group.sh

This file is intended to be run manually as a one-time setup to create a variable group with variables in Azure DevOps.

## deploy-latest-image.sh

This script can be run manually or in an automated fashion. It will deploy the latest (time based) ACR image of Spektate to an Azure Container Instance. The script has logic to determine if an image of the same name is already running in the Azure Container Instance. An Azure pipelines YAML file at the root of this repo will refer to this file for continuous deployment.

## deploy-spektate-ci.yaml

This is an Azure pipelines YAML file that will orchestrate the deployment of the latest Spektate ACR to an Azure Container Instance. It depends on a variable group created by `create-variable-group.sh` and executes `deploy-latest-image.sh`
