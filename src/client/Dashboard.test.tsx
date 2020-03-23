import Dashboard from "./Dashboard";

const dashboard = new Dashboard({});

describe("getIcon", () => {
  test("getIcon should return a valid icon", async () => {
    let icon = dashboard.getIcon("succeeded");
    expect(icon.iconName).toBe("SkypeCircleCheck");
    expect(icon.style!.color).toBe("green");
    icon = dashboard.getIcon("inProgress");
    expect(icon.iconName).toBe("ProgressRingDots");
    expect(icon.style!.color).toBe("blue");
    icon = dashboard.getIcon("canceled");
    expect(icon.iconName).toBe("SkypeCircleSlash");
    expect(icon.style!.color).toBe("gray");
    icon = dashboard.getIcon("");
    expect(icon.iconName).toBe("SkypeCircleMinus");
    expect(icon.style!.color).toBe("red");
  });
});
