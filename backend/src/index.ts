import * as express from "express";
import { cacheRefreshInterval } from "./config";
import { get as healthGet } from "./health";
import { fetch as fetchDeployment, update as updateCache } from "./lib/cache";
import { get as versionGet } from "./version";
import { createFluxNotification, loadFluxNotifications } from "./lib/flux";
const app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);

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
app.get("/api/health", (req: express.Request, res: express.Response) => {
  healthGet(req, res);
});
app.get("/api/version", (req: express.Request, res: express.Response) => {
  versionGet(req, res);
});

app.post("/api/flux", (req: express.Request, res: express.Response) => {
  const body = req.body;
  res.set("Content-Type", "text/plain");
  createFluxNotification(req.body);
  console.log(`Received ${JSON.stringify(body)} from flux post`);
  res.send(`You sent: ${JSON.stringify(body)}to Express`);
});
app.get("/api/flux", async (req: express.Request, res: express.Response) => {
  try {
    res.json(await loadFluxNotifications());
  } catch (err) {
    res.status(500).send(err.message);
  }
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
