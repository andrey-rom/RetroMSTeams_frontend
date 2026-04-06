import fs from 'fs';
import https from 'https';
import path from 'path';
import { HttpPlugin, App } from '@microsoft/teams.apps';
import { ConsoleLogger } from '@microsoft/teams.common/logging';
import { DevtoolsPlugin } from '@microsoft/teams.dev';

const sslOptions = {
  key: process.env.SSL_KEY_FILE ? fs.readFileSync(process.env.SSL_KEY_FILE) : void 0,
  cert: process.env.SSL_CRT_FILE ? fs.readFileSync(process.env.SSL_CRT_FILE) : void 0
};
const plugins = [new DevtoolsPlugin()];
if (sslOptions.cert && sslOptions.key) {
  plugins.push(new HttpPlugin(https.createServer(sslOptions)));
}
const app = new App({
  logger: new ConsoleLogger("tab", { level: "debug" }),
  plugins
});
app.tab("home", path.join(__dirname, "./client"));
function resolveListenPort() {
  const p = process.env.PORT;
  if (p === void 0 || p === "") {
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
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map