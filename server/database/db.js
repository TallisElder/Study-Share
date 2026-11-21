const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URL;

//conect to  mongo
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let database;

async function connectDB() {
    await client.connect();
    database = client.db('ce2001');
    console.log('Connected to MongoDB');
}

function getDB(){
    if (!database) {
        throw new Error('Database not connected. Call connectToDB() first.');
    }
    else{
        return database;
    }
}

module.exports = { connectDB, getDB };