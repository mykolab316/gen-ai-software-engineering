import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import {
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  Category,
  Priority,
  Status,
  Source,
  DeviceType,
} from '../types/ticket';

const categoryEnum: Joi.StringSchema = Joi.string().valid(
  'account_access',
  'technical_issue',
  'billing_question',
  'feature_request',
  'bug_report',
  'other'
);

const priorityEnum: Joi.StringSchema = Joi.string().valid('urgent', 'high', 'medium', 'low');

const statusEnum: Joi.StringSchema = Joi.string().valid(
  'new',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed'
);

const sourceEnum: Joi.StringSchema = Joi.string().valid('web_form', 'email', 'api', 'chat', 'phone');

const deviceTypeEnum: Joi.StringSchema = Joi.string().valid('desktop', 'mobile', 'tablet');

export const createTicketSchema = Joi.object({
  customer_id: Joi.string().required(),
  customer_email: Joi.string().email().required(),
  customer_name: Joi.string().required(),
  subject: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: categoryEnum,
  priority: priorityEnum,
  status: statusEnum,
  assigned_to: Joi.string().allow(null),
  tags: Joi.array().items(Joi.string()),
  metadata: Joi.object({
    source: sourceEnum,
    browser: Joi.string(),
    device_type: deviceTypeEnum,
  }),
});

export const updateTicketSchema = Joi.object({
  customer_id: Joi.string(),
  customer_email: Joi.string().email(),
  customer_name: Joi.string(),
  subject: Joi.string().min(1).max(200),
  description: Joi.string().min(10).max(2000),
  category: categoryEnum,
  priority: priorityEnum,
  status: statusEnum,
  assigned_to: Joi.string().allow(null),
  tags: Joi.array().items(Joi.string()),
  metadata: Joi.object({
    source: sourceEnum,
    browser: Joi.string(),
    device_type: deviceTypeEnum,
  }),
});

export class TicketModel {
  static create(input: CreateTicketInput): Ticket {
    const now = new Date();
    return {
      id: uuidv4(),
      customer_id: input.customer_id,
      customer_email: input.customer_email,
      customer_name: input.customer_name,
      subject: input.subject,
      description: input.description,
      category: input.category || 'other',
      priority: input.priority || 'medium',
      status: input.status || 'new',
      created_at: now,
      updated_at: now,
      resolved_at: null,
      assigned_to: input.assigned_to || null,
      tags: input.tags || [],
      metadata: {
        source: input.metadata?.source || 'api',
        browser: input.metadata?.browser,
        device_type: input.metadata?.device_type || 'desktop',
      },
    };
  }

  static update(ticket: Ticket, input: UpdateTicketInput): Ticket {
    const now = new Date();
    const updated: Ticket = { ...ticket, updated_at: now };

    if (input.customer_id !== undefined) updated.customer_id = input.customer_id;
    if (input.customer_email !== undefined) updated.customer_email = input.customer_email;
    if (input.customer_name !== undefined) updated.customer_name = input.customer_name;
    if (input.subject !== undefined) updated.subject = input.subject;
    if (input.description !== undefined) updated.description = input.description;
    if (input.category !== undefined) updated.category = input.category;
    if (input.priority !== undefined) updated.priority = input.priority;
    if (input.status !== undefined) {
      updated.status = input.status;
      if (input.status === 'resolved' || input.status === 'closed') {
        updated.resolved_at = now;
      }
    }
    if (input.assigned_to !== undefined) updated.assigned_to = input.assigned_to;
    if (input.tags !== undefined) updated.tags = input.tags;
    if (input.metadata !== undefined) {
      updated.metadata = { ...ticket.metadata, ...input.metadata };
    }

    return updated;
  }

  static validateCreate(input: any): { error?: string; value?: CreateTicketInput } {
    const { error, value } = createTicketSchema.validate(input);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateUpdate(input: any): { error?: string; value?: UpdateTicketInput } {
    const { error, value } = updateTicketSchema.validate(input);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }
}
