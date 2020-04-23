import { Request, Response } from "express";
import { getConfig } from "./config";

export const get = async (req: Request, res: Response) => {
  const config = getConfig();
  try {
    res.json({
      version: config.dockerVersion === "" ? "unknown" : config.dockerVersion,
    });
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};
