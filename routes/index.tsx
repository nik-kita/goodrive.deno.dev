import { RouteConfig } from "$fresh/server.ts";
import { HomePage } from "../pages/home.page.tsx";

export const config: RouteConfig = {
  routeOverride: "/{home}?",
};

export default HomePage;
