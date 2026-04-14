import type { LocationConfig } from "./types";

const locationConfig: LocationConfig = {
  slug: "lake-winnipesaukee-nh",
  displayName: "Lake Winnipesaukee, NH",
  mode: "lake",
  chartOrder: ["temperature","lakeLevel","inflow","outflow"],
  finalSources: {
  "usgs": {
    "lakeLevelStation": "01078000",
    "inflowStation": "01074520",
    "outflowStation": "01078000",
    "temperatureStation": "01078000"
  }
}
};

export default locationConfig;
