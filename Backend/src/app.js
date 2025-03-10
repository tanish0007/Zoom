import express from 'express';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToSocket } from './controllers/socketManager.js';
import userRoutes from './routes/routes.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("PORT", (process.env.PORT || 8080));

app.use(cors());
app.use(express.json({limit: '40KB'}));
app.use(express.urlencoded({limit: '40KB', extended: true}));
app.use("/api/v1/user", userRoutes);

app.get('/home', (req,res) => {
    return res.json({"Hi" : "Tanish"});
})

const start = async () => {
    try{
        const connectionDB = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected with DB host: ${connectionDB.connection.host}`);
    }
    catch(error){
        console.log("Error: ",error)
    }   

    server.listen(app.get("PORT"), () => {
        console.log(`Listening on port: ${app.get("PORT")}`);
    })
}

start()