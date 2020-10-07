import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import message from './messengerModel.js'
import Pusher from 'pusher'

// app config
const app = express();
const port = process.env.PORT || 8000;
dotenv.config()
const key = process.env.KEY;

const pusher = new Pusher({
    appId: '1086129',
    key: key,
    secret: '724ccde55e04986282a7',
    cluster: 'mt1',
    useTLS: true
  });

// middlewares
app.use(express.json())
app.use(cors())

// DB config
const conn = process.env.CONN_URL;
// const conn = process.env.CONN_URL;

mongoose.connect(conn,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})

const db = mongoose.connection

db.once("open", () => {
    console.log("DB connected");

    const changeStream = mongoose.connection.collection('messages').watch()
    changeStream.on('change', (change) => {
        pusher.trigger('messages', 'newMessages', {
            'change': change
          });
    })
});

// api endpoints
app.get('/', (req, res)=> res.status(200).send('hello world'));

app.post('/save/message', (req, res)=> {
    const dbMessage = req.body

    console.log(dbMessage)

    message.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
});

app.get('/save/conversation', (req, res)=> {
    message.find((err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
});

// listen
app.listen(port, ()=>console.log(`listening on localhost: ${port}`))
