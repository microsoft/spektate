import * as express from "express";
import * as path from "path";
import { get as authorGet } from "./author";
import { get as clusterSyncGet } from "./clustersync";
import { get as deploymentGet } from "./deployment";
import { get as prGet } from "./pullrequest";

const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname)));

app.get("/api/deployments", (req: express.Request, res: express.Response) => {
  deploymentGet(req, res);
});
app.get("/api/clustersync", (req: express.Request, res: express.Response) => {
  clusterSyncGet(req, res);
});
app.get("/api/author", (req: express.Request, res: express.Response) => {
  authorGet(req, res);
});
app.get("/api/pr", (req: express.Request, res: express.Response) => {
  prGet(req, res);
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log(`Listening on ${port}`);
