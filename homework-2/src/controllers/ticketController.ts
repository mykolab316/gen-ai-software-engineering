import { Request, Response } from 'express';
import { ticketStore } from '../services/ticketStore';
import { TicketModel } from '../models/ticket';
import { CsvParser } from '../services/csvParser';
import { JsonParser } from '../services/jsonParser';
import { XmlParser } from '../services/xmlParser';
import { Classifier } from '../services/classifier';
import { ImportResult, TicketFilter } from '../types/ticket';

export class TicketController {
  static createTicket(req: Request, res: Response): void {
    const validation = TicketModel.validateCreate(req.body);
    if (validation.error) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const ticket = ticketStore.create(validation.value!);
    res.status(201).json(ticket);
  }

  private static getQueryString(param: unknown): string | undefined {
    if (Array.isArray(param)) return typeof param[0] === 'string' ? param[0] : undefined;
    return typeof param === 'string' ? param : undefined;
  }

  static getTickets(req: Request, res: Response): void {
    const filter: TicketFilter = {};
    const category = TicketController.getQueryString(req.query.category);
    const priority = TicketController.getQueryString(req.query.priority);
    const status = TicketController.getQueryString(req.query.status);
    const customer_id = TicketController.getQueryString(req.query.customer_id);
    if (category) filter.category = category as TicketFilter['category'];
    if (priority) filter.priority = priority as TicketFilter['priority'];
    if (status) filter.status = status as TicketFilter['status'];
    if (customer_id) filter.customer_id = customer_id;

    const tickets = ticketStore.findAll(filter);
    res.json(tickets);
  }

  static getTicketById(req: Request, res: Response): void {
    const id = req.params.id as string;
    const ticket = ticketStore.findById(id);
    
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json(ticket);
  }

  static updateTicket(req: Request, res: Response): void {
    const id = req.params.id as string;
    const validation = TicketModel.validateUpdate(req.body);
    
    if (validation.error) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const ticket = ticketStore.update(id, validation.value!);
    
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json(ticket);
  }

  static deleteTicket(req: Request, res: Response): void {
    const id = req.params.id as string;
    const deleted = ticketStore.delete(id);
    
    if (!deleted) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.status(204).send();
  }

  static autoClassify(req: Request, res: Response): void {
    const id = req.params.id as string;
    const ticket = ticketStore.findById(id);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const result = Classifier.classify(ticket.subject, ticket.description);
    Classifier.logClassification(id, result);

    const updated = ticketStore.update(id, {
      category: result.category,
      priority: result.priority,
    });

    res.json({
      ticket: updated,
      classification: result,
    });
  }

  static async importTickets(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { buffer, originalname } = req.file;
    const extension = originalname.split('.').pop()?.toLowerCase();

    try {
      let result;
      switch (extension) {
        case 'csv':
          result = await CsvParser.parse(buffer);
          break;
        case 'json':
          result = await JsonParser.parse(buffer);
          break;
        case 'xml':
          result = await XmlParser.parse(buffer);
          break;
        default:
          res.status(400).json({ error: 'Unsupported file format. Use CSV, JSON, or XML' });
          return;
      }

      const importedTickets = ticketStore.bulkCreate(result.tickets);
      
      const importResult: ImportResult = {
        total: result.tickets.length + result.errors.length,
        successful: result.tickets.length,
        failed: result.errors.length,
        errors: result.errors,
      };

      res.status(201).json({
        summary: importResult,
        tickets: importedTickets,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
