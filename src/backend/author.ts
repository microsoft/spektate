import { Request, Response } from "express";
import { fetchAuthor } from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IAzureDevOpsRepo } from "spektate/lib/repository/IAzureDevOpsRepo";
import { IGitHub } from "spektate/lib/repository/IGitHub";
import * as config from "./config";

const getAuthor = (
  commitId: string,
  repository: IGitHub | IAzureDevOpsRepo
): Promise<IAuthor | undefined> => {
  return new Promise((resolve, reject) => {
    fetchAuthor(
      repository,
      commitId,
      config.SOURCE_REPO_ACCESS_TOKEN || config.AZURE_PIPELINE_ACCESS_TOKEN
    )
      .then((author: IAuthor | undefined) => {
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
    if (!req.query.commit) {
      res.status(400).send("commit query parameter was missing");
    } else {
      try {
        if (req.query.org && req.query.project && req.query.repo) {
          const author = await getAuthor(req.query.commit, {
            org: req.query.org,
            project: req.query.project,
            repo: req.query.repo
          });
          res.json(author || {});
        } else if (req.query.username && req.query.reponame) {
          const author = await getAuthor(req.query.commit, {
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
