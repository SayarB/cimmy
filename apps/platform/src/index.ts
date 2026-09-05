import { createApp } from "./app.js";
import { getConfig } from "./config.js";
import { migrate } from "./db/migrate.js";
import { seedFixture } from "./db/seed.js";
import { createDb } from "./db/client.js";
import { DockerodeRunner } from "./docker/runner.js";
import { startWorker } from "./worker.js";
import { startScheduler } from "./scheduler-tick.js";

const config = getConfig();
const db = createDb(config.databaseUrl);

await migrate(db);
await seedFixture(db);

const runner = new DockerodeRunner();
startWorker({ db, runner, config });
startScheduler({ db, config });

const app = createApp({ db, config });
const server = app.listen(config.port);

console.log(`cimmy platform listening on :${config.port}`);
console.log(`public url: ${config.publicUrl}`);

const shutdown = async () => {
  server.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
