import express from 'express';
import fileUpload from 'express-fileupload';
import mongoSanitize from 'express-mongo-sanitize';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import { AddressInfo } from 'net';
import path from 'path';

import 'dotenv/config';

import { permissions } from './middleware/permissions.middleware';
import { verifyToken } from './middleware';
import { Authentication, Group, Settings, Tasks } from './routes';

const app = express();

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);
app.use(cookieParser());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  mongoSanitize({
    replaceWith: '_',
  })
);

app.use('/authentication', Authentication);
app.use('/groups', verifyToken, Group);
app.use('/tasks', verifyToken, Tasks);
app.use('/settings', [verifyToken, permissions.organizationAdmin], Settings);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const httpServer = http.createServer(app);
httpServer.listen({ port: process.env.NODE_ENV === 'test' ? '0' : process.env.PORT });
const { port } = httpServer.address() as AddressInfo;
export const url = `http://localhost:${port}`;
if (process.env.NODE_ENV !== 'test') {
  console.log(`🚀 Server ready at ${url}`);
}

export default httpServer;
