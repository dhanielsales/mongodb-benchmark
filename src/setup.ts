import { TransactionOptions } from "mongodb"
import { nanoid } from 'nanoid'
import Readline from 'readline'

import { mongoConnection } from "./mongo-connection";

const READ_DATABASE_SIZE = Number(process.env.READ_DATABASE_SIZE);

async function populateReadDb(): Promise<void> {
  const client = await mongoConnection();

  await client.connect();

  const db = client.db("benchmark");
  
  const readDatabaseData = Array.from({ length: READ_DATABASE_SIZE }).map((_, index) => ({ generatedId: nanoid(), index }))

  const collection = db.collection('benchmark-data');

  const session = client.startSession()

  console.log("Populating...")

  await session.withTransaction(async () => await collection.insertMany(readDatabaseData), {
    readPreference: { mode: "primary"},
    readConcern: { level: "local" },
    writeConcern: { w: "majority" }
  } as TransactionOptions)

  await collection.createIndex({ index: 1 })

  await client.close();

  console.log("Read database populated with success!")
}

async function validateReadDb(): Promise<boolean> {
  const client = await mongoConnection();

  const db = client.db("benchmark");

  const collection = db.collection('benchmark-data');

  const results = await collection.find().toArray()

  await client.close();

  return results.length > 0 ? true : false;
}

async function createQuestion(): Promise<string> {
  return new Promise<string>((resolve, _) => {
    const read = Readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    read.question(`Do you want the database to be populated? [yes/No] `, response => {
      resolve(response)
      read.close();
    });
  })
}

/**
 * setup: check if read database was populated.
 * @returns `true` if read db is populated.
 */
export async function setup(): Promise<boolean> {
  const isValid = await validateReadDb();

  if (!isValid) {
    console.log("First you need to populate read database.")

    const response = await createQuestion()

    if (response.toLocaleLowerCase() === 'yes') {
      await populateReadDb()
      return true
    } else {
      console.log("Application stopped")
      return false
    }
  }

  return true
}
