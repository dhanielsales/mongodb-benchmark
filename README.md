# mongodb-benchmark

This is just a simple benchmark application for mongodb.

### General

To run the benchmark your need to create locally a `.env` file based on `.enx.example` file.

The application will populate a database with some data to simulate a large database, based on the `READ_DATABASE_SIZE` environment var.

#### Local

To create a mongo container instance for run a benchmark locally

```bash
docker run --cpus="1" --memory="2000M" --name mongodb-bm -e "MONGO_INITDB_ROOT_USERNAME=user" -e "MONGO_INITDB_ROOT_PASSWORD=pass" -e "MONGO_INITDB_DATABASE=benchmark" -d -p 27017:27017 mongo
```
