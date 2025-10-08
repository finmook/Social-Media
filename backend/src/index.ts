import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import userRouter from './routes/user';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/error';

const app = express();

app.use(cors({ origin: ['http://localhost:3000']}));
app.use(express.json());
app.use(logger);

app.use('/api/user', userRouter);

app.use(errorHandler);
app.get('/health', (_req, res) => res.send('ok'))
app.listen(process.env.PORT || 4000, () =>
  console.log(`API listening on :${process.env.PORT || 4000}`)
);