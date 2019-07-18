# Container Journey

This is an initiative to visualize [Project Bedrock](https://github.com/microsoft/bedrock). 

##  Onboard a Bedrock project to use Container Journey

If you have already followed the steps [here](https://github.com/microsoft/bedrock/tree/master/gitops) to setup the pipelines for a GitOps workflow in Bedrock, you may add a task to each of your pipelines to send data to the container journey storage. 

**Pre-Requisite**: Create an azure storage table account whose access keys you will need to use in subsequent steps.

1. Create a variable group with the following variables, which will be used by the tasks in each of the pipelines to access the storage. 
    - `ACCOUNT_KEY`: Set this to the access key for your storage account
    - `ACCOUNT_NAME`: Set this to the name of your storage account
    - `PARTITION_KEY`: This field can be anything you'd like to recognize your source repository in the storage by, for eg. in this example, we're using the name of the source repository `hello-bedrock`
    - `TABLE_NAME`: Set this to the name of the table in your storage account that you prefer to use

    ![](./images/variable_group.png)
2. To your CI pipeline that runs from the source repository to build the docker image, copy and paste the following task which will update the database for every build that runs from the source repository to show up in the container journey.

    ```yaml
    - bash: |
        git clone https://github.com/samiyaakhtar/container-journey.git
        cd container-journey/pipeline-scripts

        sudo /usr/bin/easy_install virtualenv
        pip install virtualenv 
        pip install --upgrade pip
        python -m virtualenv venv
        source venv/bin/activate
        python -m pip install --upgrade pip
        pip install -r requirements.txt

        tag_name="$(PARTITION_KEY)-$(Build.SourceBranchName)-$(Build.BuildId)"
        commitId=$(Build.SourceVersion)
        commitId=$(echo "${commitId:0:7}")
        echo "python update_pipeline.py $(ACCOUNT_NAME) $(ACCOUNT_KEY) $(TABLE_NAME) $(PARTITION_KEY) p1 $(Build.BuildId) imageTag $tag_name commitId $commitId"
        python update_pipeline.py $(ACCOUNT_NAME) $(ACCOUNT_KEY) $(TABLE_NAME) $(PARTITION_KEY) p1 $(Build.BuildId) imageTag $tag_name commitId $commitId 
    displayName: Update source pipeline details in Container Journey db
    ```

**Note**: The earlier in the pipeline you add this task, the earlier it will send data to the container journey. Adding it before the crucial steps is recommended since it will capture details about failures if the next steps fail.

3. To your CD release pipeline (ACR to HLD), add the following lines of code to the end of your release task: 

    ```yaml
    latest_commit=$(git rev-parse --short HEAD)

    cd ../container-journey/pipeline-scripts

    sudo /usr/bin/easy_install virtualenv
    pip install virtualenv 
    pip install --upgrade pip
    python -m virtualenv venv
    source venv/bin/activate
    python -m pip install --upgrade pip
    pip install -r requirements.txt

    echo "python update_pipeline.py $(ACCOUNT_NAME) $(ACCOUNT_KEY) $(TABLE_NAME) $(PARTITION_KEY) imageTag $(Build.BuildId) p2 $(Release.ReleaseId) hldCommitId $latest_commit"
    python update_pipeline.py $(ACCOUNT_NAME) $(ACCOUNT_KEY) $(TABLE_NAME) $(PARTITION_KEY) imageTag $(Build.BuildId) p2 $(Release.ReleaseId) hldCommitId $latest_commit
    ```

4. To the HLD to manifest pipeline, add a task that updates the db with its information to connect the three pipelines end-to-end. Again, the earlier in the tasks this appears, the more information about subsequent failures it will capture. 

    ```yaml
    - bash: |
        git clone https://github.com/samiyaakhtar/container-journey.git
        cd container-journey/pipeline-scripts

        sudo /usr/bin/easy_install virtualenv
        pip install virtualenv 
        pip install --upgrade pip
        python -m virtualenv venv
        source venv/bin/activate
        python -m pip install --upgrade pip
        pip install -r requirements.txt

        commitId=$(Build.SourceVersion)
        commitId=$(echo "${commitId:0:7}")
        echo "python update_pipeline.py $(ACCOUNT_NAME) $(ACCOUNT_KEY) $(TABLE_NAME) $(PARTITION_KEY) hldCommitId $commitId p3 $(Build.BuildId)"
        python update_pipeline.py $(ACCOUNT_NAME) $(ACCOUNT_KEY) $(TABLE_NAME) $(PARTITION_KEY) hldCommitId $commitId p3 $(Build.BuildId)
    displayName: Update manifest pipeline details in CJ db
    ```

5. Kick off a full deployment from the source to docker pipeline, and you should see some entries coming into the database for each subsequent deployment after the tasks have been added! 

## Run the Container Journey prototype

1. Clone this repository, and run `npm install`. 
2. Make sure the file located in `src/config.ts` is updated with values for the azure storage table. 
3. Then run `npm start` to view the dashboard for the hello world deployment screen.
