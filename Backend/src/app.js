import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(cors());

app.set("PORT", (process.env.PORT || 8080));

app.get('/home', (req,res) => {
    return res.json({"Hi" : "Tanish"});
})

const start = async () => {
    try{
        const connectionDB = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected with host: ${connectionDB.connection.host}`);
    }
    catch(error){
        console.log("Error: ",error)
    }

    server.listen(app.get("PORT"), () => {
        console.log(`Listening on port: ${app.get("PORT")}`);
    })
}

start()