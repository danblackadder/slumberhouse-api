import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import http from 'http';
import path from 'path';

import { Authentication, Group, Users } from './routes';
import { verifyToken } from './middleware';

const app = express();

app.use(cors());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/authentication', Authentication);
app.use('/group', verifyToken, Group);
app.use('/users', verifyToken, Users);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const httpServer = http.createServer(app);
httpServer.listen({ port: process.env.NODE_ENV === 'test' ? '0' : process.env.PORT });
if (process.env.NODE_ENV !== 'test') {
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT}/`);
}

export default httpServer;
