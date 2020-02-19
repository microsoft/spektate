import * as express from "express";
import { post as authorGet } from "./author";
import { get as clusterSyncGet } from "./clustersync";
import { get as deploymentGet } from "./deployment";

const app = express();
import bodyParser = require("body-parser");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
// app.use(bodyParser.raw());

// start the Express server
const port = 8001; // default port to listen
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});

app.get("/deployments", (req: express.Request, res: express.Response) => {
  deploymentGet(req, res);
});
app.get("/clustersync", (req: express.Request, res: express.Response) => {
  clusterSyncGet(req, res);
});
app.post("/author", (req: express.Request, res: express.Response) => {
  authorGet(req, res);
});
