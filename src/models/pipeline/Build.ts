import { Repository } from "../repository/Repository";

export class Build {
  public buildNumber: string | undefined;
  public id: string | undefined;
  public author: string | undefined;
  public queueTime: Date | undefined;
  public result: string | undefined;
  public status: string | undefined;
  public sourceBranch: string | undefined;
  public sourceVersion: string | undefined;
  public sourceVersionURL: string | undefined;
  public startTime: Date | undefined;
  public finishTime: Date | undefined;
  public URL: string | undefined;
  public repository?: Repository;
}
