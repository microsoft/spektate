import * as express from "express";
import { get as clusterSyncGet } from "./clustersync";
import { cacheRefreshInterval } from "./config";
import { get as healthGet } from "./health";
import { fetch as fetchDeployment, update as updateCache } from "./lib/cache";
import { get as versionGet } from "./version";
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/api/deployments", (req: express.Request, res: express.Response) => {
  try {
    res.json(fetchDeployment());
  } catch (err) {
    res.status(500).send(err.message);
  }
});
app.get("/api/clustersync", (req: express.Request, res: express.Response) => {
  clusterSyncGet(req, res);
});
app.get("/api/health", (req: express.Request, res: express.Response) => {
  healthGet(req, res);
});
app.get("/api/version", (req: express.Request, res: express.Response) => {
  versionGet(req, res);
});

(async () => {
  await updateCache();

  setInterval(async () => {
    await updateCache();
  }, cacheRefreshInterval());
  // start the Express server
  const port = 8001; // default port to listen
  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
  });
})();
