import 'dotenv/config';

import { Benchmark } from './benchmark';
import { mongoConnection } from './mongo-connection';
import { setup } from './setup';

(async () => {
  const setupIsValid = await setup()

  if (setupIsValid) {
    const client = await mongoConnection();
    const db = client.db("benchmark");
    
    const bm = new Benchmark(db, { type: "read" })
    await bm.run()

    client.close()
    process.exit(0)
  }
})();
