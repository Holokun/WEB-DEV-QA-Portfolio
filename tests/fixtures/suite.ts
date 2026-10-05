import { ownedDatabase, startApp } from './app.js';
import { resetTestDatabase } from '../../app/db/reset.js';

// A suite invocation owns one ordinary app across serial browser/API projects.
export default async function setup(): Promise<() => Promise<void>> {
  const dbPath = ownedDatabase();
  resetTestDatabase(dbPath);
  const app = await startApp(dbPath);
  process.env.GAME_TEST_URL = app.baseURL;
  process.env.GAME_TEST_DB = dbPath;
  return async () => { await app.stop(); };
}
