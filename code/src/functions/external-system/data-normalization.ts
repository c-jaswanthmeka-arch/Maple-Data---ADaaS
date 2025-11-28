import { ExternalSyncUnit, NormalizedItem } from '@devrev/ts-adaas';
import { ExternalCustomer, ExternalMapleKB } from './types';

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
