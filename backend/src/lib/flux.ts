import * as azure from "azure-storage";
import { getConfig } from "../config";
import * as uuid from "uuid/v4";

// const fluxStatuses: { [commitId: string]: any } = {};

export const createFluxNotification = (notification: any) => {
  const config = getConfig();

  const tableService: azure.TableService = azure.createTableService(
    config.storageAccountName,
    config.storageAccessKey
  );
  const newEntry: any = {
    PartitionKey: config.storagePartitionKey,
    RowKey: getRowKey(),
    Notification: JSON.stringify(notification),
  };
  tableService.insertEntity("flux", newEntry, (err) => {
    if (!err) {
      console.log("Pushed to the table");
    } else {
      console.log("An error occurred while pushing to table " + err);
    }
  });
};

export const getRowKey = (): string => {
  return uuid().replace("-", "").substring(0, 12);
};

// export const getFluxNotificationForCommit = (commitId: string): any => {
//   return fluxStatuses[commitId];
// }

export const loadFluxNotifications = (): Promise<any> => {
  const config = getConfig();
  const tableService: azure.TableService = azure.createTableService(
    config.storageAccountName,
    config.storageAccessKey
  );
  const fluxStatuses: { [commitId: string]: any } = {};
  const query = new azure.TableQuery().where(
    "PartitionKey eq '" + config.storagePartitionKey + "'"
  );
  const lastTwoDays = new Date();
  lastTwoDays.setDate(new Date().getDate() - 2);
  const filter = azure.TableQuery.dateFilter(
    "Timestamp",
    azure.TableUtilities.QueryComparisons.GREATER_THAN,
    lastTwoDays
  );
  // console.log("lastTwoDays = " + lastTwoDays.toString());
  query.and(filter);

  // tslint:disable-next-line
  let nextContinuationToken: azure.TableService.TableContinuationToken = <any>(
    null
  );
  return new Promise((resolve, reject) => {
    tableService.queryEntities(
      "flux",
      query!,
      nextContinuationToken,
      (error: any, result: any) => {
        if (error) {
          if (error.code === "AuthenticationFailed") {
            console.log(
              `Authentication failed for storage account '${config.storageAccountName}'.`
            );
          } else {
            console.log(error.message);
          }
          reject(error);
        } else {
          for (const entry of result.entries) {
            // console.log(JSON.stringify(entry));

            if (entry.Notification !== undefined) {
              const notification = JSON.parse(entry.Notification._);

              if (
                notification.metadata !== undefined &&
                notification.metadata.revision !== undefined
              ) {
                const revision = notification.metadata.revision.split("/");
                const commitId = revision[revision.length - 1].substring(0, 7);

                if (
                  !(commitId in fluxStatuses) ||
                  fluxStatuses[commitId].timestamp <= notification.timestamp
                ) {
                  fluxStatuses[commitId] = notification;
                }
              }
            }
          }

          console.log(JSON.stringify(fluxStatuses));
          resolve(fluxStatuses);
        }
      }
    );
  });
};
