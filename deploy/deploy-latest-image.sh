#Fail fast
set -e

# ACR
ACR_NAME="spektateacr"
ACR_REPO="spektate"
ACR_PASS=$(az acr credential show -n $ACR_NAME | jq -r ".passwords[0].value")
ACR_SERVER_URL="https://$ACR_NAME.azurecr.io"

# ACI 
CONTAINER_NAME="spektate-ci-env"
SPEKTATE_PORT=5000
RESTART_POLICY="Always"

# Expected set ENV VAR below

# AZDO_ORG_NAME="REPLACE_ME"
# AZDO_PROJECT_NAME="REPLACE_ME"
# MANIFEST_REPO_NAME="REPLACE_ME"
# AZ_STORAGE_NAME="REPLACE_ME"
# PARTITION_KEY_NAME="REPLACE_ME"
# AZ_STORAGE_TABLE_NAME="REPLACE_ME"
# MANIFEST_REPO_PAT="REPLACE_ME"
# AZDO_PIPELINE_PAT="REPLACE_ME"
# AZ_STORAGE_KEY="REPLACE_ME"

# Login to Azure
# echo "az login --service-principal --username $(SP_APP_ID) --password $(SP_PASS) --tenant $(SP_TENANT)"
# az login --service-principal --username "$(SP_APP_ID)" --password "$(SP_PASS)" --tenant "$(SP_TENANT)"

# Get the latest image in ACR
LATEST_SPEKTATE_TAG=$(az acr repository show-manifests -n $ACR_NAME --repository $ACR_REPO --top 1 --orderby time_desc --detail | jq -r ".[0].tags[0]")
echo "\nThe latest tag is $LATEST_SPEKTATE_TAG\n"
CUSTOM_IMAGE_NAME="$ACR_NAME.azurecr.io/$ACR_REPO:$LATEST_SPEKTATE_TAG"

CONTAINER_COUNT=$(az container list -g $RESOURCE_GROUP --query "[?containers[0].name=='$CONTAINER_NAME']" | jq length)
ACI_EXISTS=""
IMAGE_NAME_SAME=""

# ACI instance already exists?
if [ "$CONTAINER_COUNT" -eq "1" ]; then
    ACI_EXISTS=true
    CURRENT_IMAGE=$(az container show \
    --name $CONTAINER_NAME \
    --resource-group $RESOURCE_GROUP \
    | jq -r ".containers[0].image")

    echo "The current installed image on $CONTAINER_NAME is $CURRENT_IMAGE\n"

    # Lowercase
    LOWER_INSTALLED_IMAGE=$(echo $CURRENT_IMAGE | tr '[:upper:]' '[:lower:]')
    LOWER_LATEST_IMAGE=$(echo $CUSTOM_IMAGE_NAME | tr '[:upper:]' '[:lower:]')

    # Remove beginning and ending whitespace
    TRIMMED_INSTALLED_IMAGE="$(echo -e "${LOWER_INSTALLED_IMAGE}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    TRIMMED_LATEST_IMAGE="$(echo -e "${LOWER_LATEST_IMAGE}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    echo $TRIMMED_INSTALLED_IMAGE
    echo $TRIMMED_LATEST_IMAGE

    if [ "$TRIMMED_LATEST_IMAGE" = "$TRIMMED_INSTALLED_IMAGE" ]; then
        echo "Images have the same name...\n"
        IMAGE_NAME_SAME=1
    fi
fi

# ACI instance has the same named image installed?
if [ $IMAGE_NAME_SAME ]; then
    echo "Restarting $CONTAINER_NAME since the latest image is already installed.\n"
    az container restart \
        --name $CONTAINER_NAME \
        --resource-group $RESOURCE_GROUP 
    echo "Restarted $CONTAINER_NAME. Exiting."
    exit 0
fi

# If ACI instance already exists, then stop the instance
if [ $ACI_EXISTS ]; then 
    echo "Stopping container instance '$CONTAINER_NAME'\n"
    az container stop \
        --name $CONTAINER_NAME \
        --resource-group $RESOURCE_GROUP 
fi

# Create/re-install image on instance
echo "Install the latest image on the container instance '$CONTAINER_NAME'\n"
az container create \
    --name $CONTAINER_NAME \
    --resource-group $RESOURCE_GROUP \
    --image $CUSTOM_IMAGE_NAME \
    --cpu 1 \
    --memory 1 \
    --registry-login-server "$ACR_NAME.azurecr.io" \
    --registry-username $ACR_NAME \
    --registry-password $ACR_PASS \
    --port 80 $SPEKTATE_PORT \
    --ip-address Public \
    --restart-policy $RESTART_POLICY \
    --environment-variables \
        REACT_APP_MANIFEST=$MANIFEST_REPO_NAME \
        REACT_APP_MANIFEST_ACCESS_TOKEN="$MANIFEST_REPO_PAT" \
        REACT_APP_PIPELINE_ACCESS_TOKEN="$AZDO_PIPELINE_PAT" \
        REACT_APP_PIPELINE_ORG=$AZDO_ORG_NAME \
        REACT_APP_PIPELINE_PROJECT=$AZDO_PROJECT_NAME \
        REACT_APP_SOURCE_REPO_ACCESS_TOKEN="$MANIFEST_REPO_PAT" \
        REACT_APP_STORAGE_ACCESS_KEY="$AZ_STORAGE_KEY" \
        REACT_APP_STORAGE_ACCOUNT_NAME=$AZ_STORAGE_NAME \
        REACT_APP_STORAGE_PARTITION_KEY=$PARTITION_KEY_NAME \
        REACT_APP_STORAGE_TABLE_NAME=$AZ_STORAGE_TABLE_NAME \
    --dns-name-label $CONTAINER_NAME 

# If ACI instance already existed just start it since we stopped it
if [ $ACI_EXISTS ]; then 
    echo "Starting container instance '$CONTAINER_NAME'\n"
    az container start \
        --name $CONTAINER_NAME \
        --resource-group $RESOURCE_GROUP 
fi

# Where to look for the running instance
fqdn=$(az container show -n $CONTAINER_NAME -g $RESOURCE_GROUP | jq -r ".ipAddress.fqdn")
echo "\nVisit http://$fqdn:$SPEKTATE_PORT"







