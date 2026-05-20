import express from 'express';
import ticketRoutes from './routes/tickets';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/tickets', ticketRoutes);

app.use(errorHandler);

export default app;
