import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import userRouter from './routes/user';
import postRouter from './routes/post';
import friendRouter from './routes/friend';
import messageRouter from './routes/message';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/error';

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''));
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(logger);

app.use('/api/user', userRouter);
app.use('/api/post',postRouter);
app.use('/api/friend',friendRouter);
app.use('/api/message',messageRouter);

app.use(errorHandler);
app.get('/health', (_req, res) => res.send('ok'))
app.listen(process.env.PORT || 4000, () =>
  console.log(`API listening on :${process.env.PORT || 4000}`)
);