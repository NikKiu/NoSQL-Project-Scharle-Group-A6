import { MongoClient, Db } from 'mongodb';

const uri = "mongodb://localhost:3000";
const client = new MongoClient(uri);

let db: Db;

export async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db("db_name");
        console.log("Erfolgreich mit MongoDB verbunden");
    } catch (error) {
        console.error("Verbindungsfehler:", error);
    }
}

export { db };
