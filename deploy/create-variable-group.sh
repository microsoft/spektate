# Expected set ENV VAR below

# SP_APP_ID="REPLACE_ME"
# SP_PASS="REPLACE_ME"
# SP_TENANT="REPLACE_ME"
# AZDO_ORG_NAME="REPLACE_ME"
# AZDO_PROJECT_NAME="REPLACE_ME"
# MANIFEST_REPO_NAME="REPLACE_ME"
# AZ_STORAGE_NAME="REPLACE_ME"
# PARTITION_KEY_NAME="REPLACE_ME"
# AZ_STORAGE_TABLE_NAME="REPLACE_ME"
# MANIFEST_REPO_PAT="REPLACE_ME"
# AZDO_PIPELINE_PAT="REPLACE_ME"
# AZ_STORAGE_KEY="REPLACE_ME"

AZDO_ORG_URL="https://dev.azure.com/$AZDO_ORG_NAME"

# Delete and create variable group
vg_name="spektate-ci-vg"
vg_result=$(az pipelines variable-group list --org $AZDO_ORG_URL -p $AZDO_PROJECT_NAME)
vg_exists=$(echo $vg_result | jq -r --arg vg_name "$vg_name" '.[].name | select(. == $vg_name ) != null')
vg_id=$(echo "$vg_result"  | jq -r --arg vg_name "$vg_name" '.[] | select(.name == $vg_name) | .id')

if [ $vg_id ]; then
    echo "variable group to delete is $vg_id"
    az pipelines variable-group delete --id "$vg_id" --yes --org $AZDO_ORG_URL -p $AZDO_PROJECT_NAME
fi

echo "Creating variable group $vg_name"
CREATE_RESULT=$(az pipelines variable-group create --name $vg_name \
    --org $AZDO_ORG_URL \
    -p $AZDO_PROJECT_NAME \
    --variables \
        MANIFEST_REPO_NAME=$MANIFEST_REPO_NAME \
        AZ_STORAGE_NAME=$AZ_STORAGE_NAME \
        PARTITION_KEY_NAME=$PARTITION_KEY_NAME \
        AZ_STORAGE_TABLE_NAME=$AZ_STORAGE_TABLE_NAME \
        SP_APP_ID=$SP_APP_ID \
        SP_TENANT=$SP_TENANT) 

GROUP_ID=$(echo $CREATE_RESULT | jq ".id")
echo "The group id is $GROUP_ID"

echo "Setting secret variables..."
az pipelines variable-group variable create \
    --org $AZDO_ORG_URL \
    -p $AZDO_PROJECT_NAME \
    --group-id "$GROUP_ID" \
    --secret true \
    --name "MANIFEST_REPO_PAT" \
    --value $MANIFEST_REPO_PAT

az pipelines variable-group variable create \
    --org $AZDO_ORG_URL \
    -p $AZDO_PROJECT_NAME \
    --group-id "$GROUP_ID" \
    --secret true \
    --name "AZDO_PIPELINE_PAT" \
    --value $AZDO_PIPELINE_PAT

az pipelines variable-group variable create \
    --org $AZDO_ORG_URL \
    -p $AZDO_PROJECT_NAME \
    --group-id "$GROUP_ID" \
    --secret true \
    --name "AZ_STORAGE_KEY" \
    --value $AZ_STORAGE_KEY 

az pipelines variable-group variable create \
    --org $AZDO_ORG_URL \
    -p $AZDO_PROJECT_NAME \
    --group-id "$GROUP_ID" \
    --secret true \
    --name "SP_PASS" \
    --value $SP_PASS 