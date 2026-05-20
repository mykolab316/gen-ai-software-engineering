import { Router } from 'express';
import multer from 'multer';
import { TicketController } from '../controllers/ticketController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', TicketController.createTicket);
router.post('/import', upload.single('file'), TicketController.importTickets);
router.get('/', TicketController.getTickets);
router.get('/:id', TicketController.getTicketById);
router.put('/:id', TicketController.updateTicket);
router.delete('/:id', TicketController.deleteTicket);
router.post('/:id/auto-classify', TicketController.autoClassify);

export default router;
