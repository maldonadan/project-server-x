const { MongoClient } = require("mongodb");
const { MONGO_DB_USERNAME, MONGO_DB_PASSWORD } = process.env;
const uri = `mongodb+srv://${MONGO_DB_USERNAME}:${MONGO_DB_PASSWORD}@cluster0.jvhhw.mongodb.net/ProjectX?retryWrites=true&w=majority`;

class MongoDataBase {
  constructor(client) {
    this.client = client;
  }
  static init() {
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    return new MongoDataBase(client);
  }
  findOne(collectionName, criteria) {
    return new Promise((resolve) => {
      this.client.connect(async (err) => {
        if (err) {
          return reject(err);
        }
        const results = await this.client
          .db("ProjectX")
          .collection(collectionName)
          .findOne(criteria);
        resolve(results);
        this.client.close();
      });
    });
  }
  findAll(collectionName) {
    return new Promise((resolve) => {
      this.client.connect(async (err) => {
        if (err) {
          return reject(err);
        }
        const cursor = this.client
          .db("ProjectX")
          .collection(collectionName)
          .find();
        const results = await cursor.toArray();
        resolve(results);
        this.client.close();
      });
    });
  }
  async save(collectionName, data) {
    await new Promise((r) => {
      this.client.connect(async (err) => {
        if (err) {
          return reject(err);
        }
        await this.client
          .db("ProjectX")
          .collection(collectionName)
          .insertOne(data);
        this.client.close();
        r();
      });
    });
  }
  updateOne(collectionName, criteria, document) {
    return this.client.connect(async (err) => {
      if (err) {
        return reject(err);
      }
      await this.client.db("ProjectX").collection(collectionName).updateOne(
        criteria,
        {
          $set: document,
        },
        { upsert: true }
      );
      this.client.close();
    });
  }
  async find(collectionName, criteria) {
    return new Promise((resolve) => {
      this.client.connect(async (err) => {
        if (err) {
          return reject(err);
        }
        const cursor = this.client
          .db("ProjectX")
          .collection(collectionName)
          .find(criteria);
        const results = await cursor.toArray();
        resolve(results);
        this.client.close();
      });
    });
  }
  async groupByUserId(collectionName, userIds) {
    const documents = await this.find(collectionName, {
      user_id: { $in: userIds },
    });
    return documents.reduce((acc, document) => {
      acc[document.user_id] = document;
      return acc;
    }, {});
  }
  async bulkWrite(collectionName, operations) {
    return new Promise((resolve) => {
      this.client.connect(async (err) => {
        if (err) {
          return reject(err);
        }
        operations = operations.map(({ operation, document }) => {
          if (operation === "insert") {
            return { insertOne: { document } };
          } else {
            return {
              updateOne: {
                filter: { user_id: document.user_id },
                update: { $set: document },
                upsert: true,
              },
            };
          }
        });
        const res = await this.client
          .db("ProjectX")
          .collection(collectionName)
          .bulkWrite(operations);
        console.log(res);
        resolve();
        this.client.close();
      });
    });
  }
}

module.exports = MongoDataBase;
