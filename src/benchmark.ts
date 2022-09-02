import { Db } from "mongodb"
import { nanoid } from "nanoid";

import { updateWriteObj } from './write-obj'

const CONCURRENCY = Number(process.env.CONCURRENCY);
const EXECUTIONS = Number(process.env.EXECUTIONS);

type BenchmarkType =  "read" | "write" | "update"

interface PerformResult {
  type:  BenchmarkType;
  "duration (ms)": number;
  "query status": "success" | "failure";
  "query result": any;
  "related index": number | null;
}

interface Options {
  type?: BenchmarkType;
  concurrency?: number;
  executions?: number;
} 


export class Benchmark {
  private readonly concurrency: number;
  private readonly executions: number;
  private readonly type: BenchmarkType;
  private readonly db: Db;

  private failures: number = 0;
  private successes: number = 0;
  private totalDuration: number = 0;
  private longerDurationQuery: number = 0;

  constructor(db: Db, options?: Options) {
    this.db = db;

    this.concurrency = options?.concurrency || CONCURRENCY;
    this.executions = options?.executions || EXECUTIONS;
    this.type = options?.type || "read";
  }

  public async run(): Promise<void> {
    console.log(`Start Benchmark...`)
    const concurrencies = Array.from({ length: this.executions }).map(() => this.perform());
    const results = await Promise.all(concurrencies);

    const formatedResults = ([] as Array<PerformResult>).concat.apply([], results);

    console.table(formatedResults)
    console.log(`\n`)
    console.log(`Query successes: ${this.successes}`)
    console.log(`Query failures: ${this.failures}`)
    console.log(`All queries Duration (ms): ${this.totalDuration}`)
    console.log(`Longer Duration Query (ms): ${this.longerDurationQuery}`)
  }


  private async perform(): Promise<Array<PerformResult>> {
    const executionsArr = Array.from({ length: this.concurrency }) 
    
    const result: Array<PerformResult> = []

    for (const _ in executionsArr) {
      const [currentIndex] = await this.db.collection('benchmark-data').find().sort({ index:-1 }).limit(1).toArray()

      const start = new Date().getTime();

      const collection = this.db.collection('benchmark-data');

      let queryResult: any;
      let index: number | null = null;
  
      try {
        if (this.type === "read") {
          index = Math.floor(Math.random() * currentIndex.index);
          queryResult = await collection.find({ index }).toArray()
        } 
        
        if (this.type === "write") {
          index = currentIndex.index + 1
          queryResult = await collection.insertOne({ generatedId: nanoid(), index })
        }

        if (this.type === "update") {
          index = Math.floor(Math.random() * currentIndex.index);
          queryResult = await collection.updateOne(
            { index },
            {
              $set: { writeObj: updateWriteObj }
            }
          )
        }
      
        const duration = new Date().getTime() - start;

        result.push({
          type: this.type,
          "duration (ms)": duration,
          "query status": "success",
          "query result": JSON.stringify(queryResult),
          "related index": index
        })

        this.successes++
        this.totalDuration += duration
        if (duration > this.longerDurationQuery) {
          this.longerDurationQuery = duration
        }
      } catch (err) {
        const duration = new Date().getTime() - start;
      
        result.push({
          type: this.type,
          "duration (ms)": duration,
          "query status": "failure",
          "query result": "None",
          "related index": index
        })

        this.failures++
        this.totalDuration += duration
        if (duration > this.longerDurationQuery) {
          this.longerDurationQuery = duration
        }
      }
    }

    return result
  }
}
