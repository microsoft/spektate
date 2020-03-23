import "@testing-library/jest-dom/extend-expect";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import * as React from "react";
import * as ReactDOM from "react-dom";
import "./client/css/dashboard.css";
import Dashboard from "./client/Dashboard";
import registerServiceWorker from "./client/registerServiceWorker";

initializeIcons();
ReactDOM.render(<Dashboard />, document.getElementById("root") as HTMLElement);
registerServiceWorker();
