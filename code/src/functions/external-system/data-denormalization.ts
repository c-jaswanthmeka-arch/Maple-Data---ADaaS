import { ExternalSystemItem } from '@devrev/ts-adaas';
import { ExternalCustomer, ExternalMapleKB } from './types';

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
