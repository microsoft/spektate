import { Request, Response } from "express";
import { fetchAuthor, IDeployment } from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import * as config from "./config";

const getAuthor = (deployment: IDeployment): Promise<IAuthor | undefined> => {
  return new Promise((resolve, reject) => {
    fetchAuthor(
      deployment,
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

export const post = async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Origin", "localhost");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, Content-Type, X-Auth-Token"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST");
  if (config.isValuesValid()) {
    // console.dir(req.body as IDeployment);
    console.log(req.headers);
    const author = await getAuthor(req.body as IDeployment);
    res.json(author || {});
    console.log("Returning ", author);
    // res.json({});
  } else {
    res
      .status(500)
      .send(
        "Environment variables need to be exported for Spektate configuration"
      );
  }
};
