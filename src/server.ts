import express from 'express';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import path from 'path';

import 'dotenv/config';

import { permissions } from './middleware/permissions.middleware';
import { verifyToken } from './middleware';
import { Authentication, Group, Settings } from './routes';

const app = express();

app.use(cors());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/authentication', Authentication);
app.use('/groups', verifyToken, Group);
app.use('/settings', [verifyToken, permissions.organizationAdmin], Settings);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const httpServer = http.createServer(app);
httpServer.listen({ port: process.env.NODE_ENV === 'test' ? '0' : process.env.PORT });
if (process.env.NODE_ENV !== 'test') {
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT}/`);
}

export default httpServer;
