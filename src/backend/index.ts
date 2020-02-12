import * as express from "express";
import { get as deploymentGet } from "./deployment";
import { get as manifestRepoGet } from "./manifestRepo";

const app = express();

app.get("/deployments", (req: express.Request, res: express.Response) => {
  deploymentGet(req, res);
});
app.get("/manifestRepo", (req: express.Request, res: express.Response) => {
  manifestRepoGet(req, res);
});

// start the Express server
const port = 8001; // default port to listen
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
