import { resolve } from 'node:path';
import { createApplication } from './application.js';
const app = createApplication({ dbPath: resolve(process.env.DB_PATH ?? 'data/games.sqlite'), uiDir: resolve(process.env.UI_DIR ?? 'dist/app/ui') });
app.server.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => {
  const address = app.server.address();
  if (address && typeof address !== 'string') console.log(JSON.stringify({ url: `http://127.0.0.1:${address.port}` }));
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { void app.close().then(() => process.exit(0)); });
