import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("PORT", (process.env.PORT || 8080));

app.get('/home', (req,res) => {
    return res.json({"Hi" : "Tanish"});
})

const start = async () => {
    server.listen(app.get("PORT"), () => {
        console.log(`Listening on port: ${app.get("PORT")}`);
    })
}

start()