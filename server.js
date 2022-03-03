import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { APP_PORT, DB_URL } from './config';
import errorHandler from './middleware/errorHandler';
import router from './routes';
const app = express();

mongoose.connect(DB_URL);
const db = mongoose.connection;
db.on('error',console.error.bind(console,'connection error:'));
db.once('open',()=>{
    console.log('DB connected...')
});

global.appRoot = path.resolve(__dirname);
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use('/api',router);
app.use(errorHandler);
app.listen(APP_PORT,()=>{
    console.log(`port listening on  ${APP_PORT}`);
});