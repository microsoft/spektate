import { Request, Response } from "express";
import * as config from "./config";

export const get = async (req: Request, res: Response) => {
  try {
    res.json({
      version: config.DOCKER_VERSION === "" ? "unknown" : config.DOCKER_VERSION
    });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};
