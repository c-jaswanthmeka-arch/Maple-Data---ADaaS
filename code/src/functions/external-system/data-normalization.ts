import { ExternalSyncUnit, NormalizedItem } from '@devrev/ts-adaas';
import { ExternalCustomer, ExternalMapleKB, ExternalPart, ExternalTicket, ExternalIssue, ExternalComment, ExternalUser } from './types';

// Normalization functions for Maple data

export function normalizeCustomer(item: ExternalCustomer): NormalizedItem {
  const createItemUrl = (id: string) => `https://maple-data.com/customers/${id}`;

  return {
    id: item.id,
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      name: item.name,
      email: item.email,
      company: item.company,
      item_url_field: createItemUrl(item.id),
    },
  };
}

export function normalizeMapleKB(item: ExternalMapleKB): NormalizedItem {
  const createItemUrl = (id: string) => `https://maple-data.com/kb/${id}`;

  return {
    id: item.id,
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      title: item.title,
      content: item.content,
      category: item.category,
      item_url_field: createItemUrl(item.id),
    },
  };
}

export function normalizePart(item: ExternalPart): NormalizedItem {
  const createItemUrl = (id: string) => `https://maple-data.com/parts/${id}`;

  return {
    id: item.id,
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      title: item.title,
      type: item.type,
      parent: item.parent,
      owner_id: item.owner_id,
      description: item.description,
      item_url_field: createItemUrl(item.id),
    },
  };
}

export function normalizeTicket(item: ExternalTicket): NormalizedItem {
  const createItemUrl = (id: string) => `https://maple-data.com/tickets/${id}`;

  return {
    id: item.id,
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      subject: item.subject,
      description: item.description,
      status: item.status,
      priority: item.priority,
      account_id: item.account_id,
      owner_id: item.owner_id,
      contact_id: item.contact_id,
      group_id: item.group_id,
      item_url_field: createItemUrl(item.id),
    },
  };
}

export function normalizeIssue(item: ExternalIssue): NormalizedItem {
  const createItemUrl = (id: string) => `https://maple-data.com/issues/${id}`;

  return {
    id: item.id,
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      subject: item.subject,
      description: item.description,
      status: item.status,
      impact: item.impact,
      owner_id: item.owner_id,
      related_issue_ids: item.related_issue_ids,
      item_url_field: createItemUrl(item.id),
    },
  };
}

export function normalizeComment(item: ExternalComment): NormalizedItem {
  const createItemUrl = (id: string) => `https://maple-data.com/comments/${id}`;

  return {
    id: item.id,
    created_date: item.created_date,
    modified_date: item.modified_date,
    data: {
      body: item.body,
      parent_id: item.parent_id,
      created_by_id: item.created_by_id,
      visibility: item.visibility,
      item_url_field: createItemUrl(item.id),
    },
  };
}

export function normalizeUser(item: ExternalUser): NormalizedItem {
  // Use email as ID since users.json doesn't have an id field
  const userId = item.email;
  const createItemUrl = (email: string) => `https://maple-data.com/users/${encodeURIComponent(email)}`;

  return {
    id: userId,
    created_date: new Date().toISOString(), // Users don't have created_date, use current time
    modified_date: new Date().toISOString(), // Users don't have modified_date, use current time
    data: {
      email: item.email,
      full_name: item.full_name,
      state: item.state,
      phone_numbers: Array.isArray(item.phone_numbers) ? item.phone_numbers.join(', ') : (item.phone_numbers || ''),
      item_url_field: createItemUrl(userId),
    },
  };
}
