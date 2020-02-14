const browser = window as any;
export let config: { [id: string]: string | undefined } = {
  AZURE_ORG:
    browser.ENV && browser.ENV.REACT_APP_PIPELINE_ORG !== undefined
      ? browser.ENV.REACT_APP_PIPELINE_ORG
      : process.env.REACT_APP_PIPELINE_ORG,
  AZURE_PIPELINE_ACCESS_TOKEN:
    browser.ENV && browser.ENV.REACT_APP_PIPELINE_ACCESS_TOKEN !== undefined
      ? browser.ENV.REACT_APP_PIPELINE_ACCESS_TOKEN
      : process.env.REACT_APP_PIPELINE_ACCESS_TOKEN,
  AZURE_PROJECT:
    browser.ENV && browser.ENV.REACT_APP_PIPELINE_PROJECT !== undefined
      ? browser.ENV.REACT_APP_PIPELINE_PROJECT
      : process.env.REACT_APP_PIPELINE_PROJECT,
  BACKEND_URL:
    browser.ENV && browser.ENV.REACT_APP_BACKEND_URL !== undefined
      ? browser.ENV.REACT_APP_BACKEND_URL
      : process.env.REACT_APP_BACKEND_URL,
  GITHUB_MANIFEST_USERNAME:
    browser.ENV && browser.ENV.REACT_APP_GITHUB_MANIFEST_USERNAME !== undefined
      ? browser.ENV.REACT_APP_GITHUB_MANIFEST_USERNAME
      : process.env.REACT_APP_GITHUB_MANIFEST_USERNAME,
  MANIFEST:
    browser.ENV && browser.ENV.REACT_APP_MANIFEST !== undefined
      ? browser.ENV.REACT_APP_MANIFEST
      : process.env.REACT_APP_MANIFEST,
  MANIFEST_ACCESS_TOKEN:
    browser.ENV && browser.ENV.REACT_APP_MANIFEST_ACCESS_TOKEN !== undefined
      ? browser.ENV.REACT_APP_MANIFEST_ACCESS_TOKEN
      : process.env.REACT_APP_MANIFEST_ACCESS_TOKEN,
  SOURCE_REPO_ACCESS_TOKEN:
    browser.ENV && browser.ENV.REACT_APP_SOURCE_REPO_ACCESS_TOKEN !== undefined
      ? browser.ENV.REACT_APP_SOURCE_REPO_ACCESS_TOKEN
      : process.env.REACT_APP_SOURCE_REPO_ACCESS_TOKEN,
  STORAGE_ACCOUNT_KEY:
    browser.ENV && browser.ENV.REACT_APP_STORAGE_ACCESS_KEY !== undefined
      ? browser.ENV.REACT_APP_STORAGE_ACCESS_KEY
      : process.env.REACT_APP_STORAGE_ACCESS_KEY,
  STORAGE_ACCOUNT_NAME:
    browser.ENV && browser.ENV.REACT_APP_STORAGE_ACCOUNT_NAME !== undefined
      ? browser.ENV.REACT_APP_STORAGE_ACCOUNT_NAME
      : process.env.REACT_APP_STORAGE_ACCOUNT_NAME,
  STORAGE_PARTITION_KEY:
    browser.ENV && browser.ENV.REACT_APP_STORAGE_PARTITION_KEY !== undefined
      ? browser.ENV.REACT_APP_STORAGE_PARTITION_KEY
      : process.env.REACT_APP_STORAGE_PARTITION_KEY,
  STORAGE_TABLE_NAME:
    browser.ENV && browser.ENV.REACT_APP_STORAGE_TABLE_NAME !== undefined
      ? browser.ENV.REACT_APP_STORAGE_TABLE_NAME
      : process.env.REACT_APP_STORAGE_TABLE_NAME
};
