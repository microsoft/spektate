import * as express from "express";
import * as path from "path";
import { get as clusterSyncGet } from "./backend/clustersync";
import { cacheRefreshInterval } from "./backend/config";
import {
  fetch as fetchDeployment,
  update as updateCache
} from "./backend/lib/cache";

const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname)));

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

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

(async () => {
  await updateCache();

  setInterval(async () => {
    await updateCache();
  }, cacheRefreshInterval());
  const port = process.env.PORT || 5000;
  app.listen(port);
  console.log(`Listening on ${port}`);
})();
