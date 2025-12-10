import { ExternalSystemItem } from '@devrev/ts-adaas';
import { ExternalCustomer, ExternalMapleKB, ExternalPart, ExternalTicket, ExternalIssue, ExternalComment, ExternalUser } from './types';

// Denormalization functions for Maple data

export function denormalizeCustomer(item: ExternalSystemItem): ExternalCustomer {
  return {
    id: item.id.devrev,
    name: item.data.name,
    email: item.data.email,
    company: item.data.company,
    created_date: item.created_date,
    modified_date: item.modified_date,
  };
}

export function denormalizeMapleKB(item: ExternalSystemItem): ExternalMapleKB {
  return {
    id: item.id.devrev,
    title: item.data.title,
    content: item.data.content,
    category: item.data.category,
    created_date: item.created_date,
    modified_date: item.modified_date,
  };
}

export function denormalizePart(item: ExternalSystemItem): ExternalPart {
  return {
    id: item.id.devrev,
    title: item.data.title,
    type: item.data.type,
    parent: item.data.parent,
    owner_id: item.data.owner_id,
    description: item.data.description,
    created_date: item.created_date,
    modified_date: item.modified_date,
  };
}

export function denormalizeTicket(item: ExternalSystemItem): ExternalTicket {
  return {
    id: item.id.devrev,
    subject: item.data.subject,
    description: item.data.description,
    status: item.data.status,
    priority: item.data.priority,
    account_id: item.data.account_id,
    owner_id: item.data.owner_id,
    contact_id: item.data.contact_id,
    group_id: item.data.group_id,
    created_date: item.created_date,
    modified_date: item.modified_date,
  };
}

export function denormalizeIssue(item: ExternalSystemItem): ExternalIssue {
  return {
    id: item.id.devrev,
    subject: item.data.subject,
    description: item.data.description,
    status: item.data.status,
    impact: item.data.impact,
    owner_id: item.data.owner_id,
    related_issue_ids: item.data.related_issue_ids,
    created_date: item.created_date,
    modified_date: item.modified_date,
  };
}

export function denormalizeComment(item: ExternalSystemItem): ExternalComment {
  return {
    id: item.id.devrev,
    body: item.data.body,
    parent_id: item.data.parent_id,
    created_by_id: item.data.created_by_id,
    visibility: item.data.visibility,
    created_date: item.created_date,
    modified_date: item.modified_date,
  };
}

export function denormalizeUser(item: ExternalSystemItem): ExternalUser {
  return {
    email: item.data.email,
    full_name: item.data.full_name,
    state: item.data.state,
    phone_numbers: item.data.phone_numbers ? (typeof item.data.phone_numbers === 'string' ? item.data.phone_numbers.split(',').filter((p: string) => p.trim()) : item.data.phone_numbers) : undefined,
  };
}
