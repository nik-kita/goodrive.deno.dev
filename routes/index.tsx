import { RouteConfig } from "$fresh/server.ts";
import { HomePage } from "../pages/Home/Page.tsx";

export const config: RouteConfig = {
  routeOverride: "/{home}?",
};

export default HomePage;
