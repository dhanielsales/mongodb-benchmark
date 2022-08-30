import { MongoClient, Db } from "mongodb"

const MONGODB_URL = process.env.MONGODB_URL as string

export async function mongoConnection(): Promise<MongoClient> {
  const client = new MongoClient(MONGODB_URL);
  await client.connect();
  return client
}
