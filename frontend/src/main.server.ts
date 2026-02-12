import { provideZoneChangeDetection } from "@angular/core";
import {
  bootstrapApplication,
  BootstrapContext,
} from "@angular/platform-browser";
import { App } from "./app/app";
import { config } from "./app/app.config.server";

export default (context: BootstrapContext) => {
  return bootstrapApplication(App, {...config, providers: [provideZoneChangeDetection(), ...config.providers]}, context);
};
