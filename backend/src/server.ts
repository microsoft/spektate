import * as express from "express";
import * as path from "path";
import { cacheRefreshInterval } from "./config";
import { get as healthGet } from "./health";
import { fetch as fetchDeployment, update as updateCache } from "./lib/cache";
import { get as versionGet } from "./version";

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
app.get("/api/health", (req: express.Request, res: express.Response) => {
  healthGet(req, res);
});
app.get("/api/version", (req: express.Request, res: express.Response) => {
  versionGet(req, res);
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
