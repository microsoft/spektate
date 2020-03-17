import { Request, Response } from "express";
import { fetchPR } from "spektate/lib/IDeployment";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";
import { IAzureDevOpsRepo } from "spektate/lib/repository/IAzureDevOpsRepo";
import { IGitHub } from "spektate/lib/repository/IGitHub";
import * as config from "./config";

const getPR = (
  prId: string,
  repository: IGitHub | IAzureDevOpsRepo
): Promise<IPullRequest | undefined> => {
  return new Promise((resolve, reject) => {
    fetchPR(
      repository,
      prId,
      config.SOURCE_REPO_ACCESS_TOKEN || config.AZURE_PIPELINE_ACCESS_TOKEN
    )
      .then((author: IPullRequest | undefined) => {
        resolve(author);
      })
      .catch(err => {
        console.error(err);
        reject(err);
      });
  });
};

export const get = async (req: Request, res: Response) => {
  if (config.isValuesValid(res)) {
    if (!req.query.pr) {
      res.status(400).send("pr query parameter was missing");
    } else {
      try {
        if (req.query.org && req.query.project && req.query.repo) {
          const author = await getPR(req.query.pr, {
            org: req.query.org,
            project: req.query.project,
            repo: req.query.repo
          });
          res.json(author || {});
        } else if (req.query.username && req.query.reponame) {
          const author = await getPR(req.query.pr, {
            reponame: req.query.reponame,
            username: req.query.username
          });
          res.json(author || {});
        } else {
          res.status(400).send("required query parameters were missing");
        }
      } catch (err) {
        console.log(err);
        res.status(500);
      }
    }
  }
};
