import * as React from "react";
import { cleanup, render } from "@testing-library/react";
import Dashboard from "./Dashboard";

afterEach(cleanup);

it("CheckboxWithLabel changes the text after click", () => {
  const hi = render(<Dashboard />);
});
