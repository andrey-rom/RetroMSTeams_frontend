import fs from "fs";
import https from "https";
import path from "path";

import { App, HttpPlugin, IPlugin } from "@microsoft/teams.apps";
import { ConsoleLogger } from "@microsoft/teams.common/logging";
import { DevtoolsPlugin } from "@microsoft/teams.dev";

const sslOptions = {
  key: process.env.SSL_KEY_FILE ? fs.readFileSync(process.env.SSL_KEY_FILE) : undefined,
  cert: process.env.SSL_CRT_FILE ? fs.readFileSync(process.env.SSL_CRT_FILE) : undefined,
};
const plugins: IPlugin[] = [new DevtoolsPlugin()];
if (sslOptions.cert && sslOptions.key) {
  plugins.push(new HttpPlugin(https.createServer(sslOptions)));
}
const app = new App({
  logger: new ConsoleLogger("tab", { level: "debug" }),
  plugins: plugins,
});

app.tab("home", path.join(__dirname, "./client"));

/** Azure App Service (iisnode) sets PORT to a named pipe string; Linux uses a numeric port. */
function resolveListenPort(): number | string {
  const p = process.env.PORT;
  if (p === undefined || p === "") {
    return 3978;
  }
  const n = Number(p);
  if (!Number.isNaN(n) && String(n) === p.trim()) {
    return n;
  }
  return p;
}

(async () => {
  await app.start(resolveListenPort());
})();
