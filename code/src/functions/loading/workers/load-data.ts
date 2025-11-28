import {
  ExternalSystemItem,
  ExternalSystemItemLoadingParams,
  ExternalSystemItemLoadingResponse,
  LoaderEventType,
  processTask,
} from '@devrev/ts-adaas';

import { denormalizeCustomer, denormalizeMapleKB } from '../../external-system/data-denormalization';
import { HttpClient } from '../../external-system/http-client';
import { LoaderState } from '../index';

/* eslint-disable @typescript-eslint/no-unused-vars */

// Create function for customers
async function createCustomer({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  const httpClient = new HttpClient(event);
  const customer = denormalizeCustomer(item);
  const createCustomerResponse = await httpClient.createCustomer(customer);
  return createCustomerResponse;
}

// Update function for customers
async function updateCustomer({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  const httpClient = new HttpClient(event);
  const customer = denormalizeCustomer(item);
  const updateCustomerResponse = await httpClient.updateCustomer(customer);
  return updateCustomerResponse;
}

// Create function for Maple KB
async function createMapleKB({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  const httpClient = new HttpClient(event);
  const kb = denormalizeMapleKB(item);
  const createKBResponse = await httpClient.createMapleKB(kb);
  return createKBResponse;
}

// Update function for Maple KB
async function updateMapleKB({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  const httpClient = new HttpClient(event);
  const kb = denormalizeMapleKB(item);
  const updateKBResponse = await httpClient.updateMapleKB(kb);
  return updateKBResponse;
}

processTask<LoaderState>({
  task: async ({ adapter }) => {
    const { reports, processed_files } = await adapter.loadItemTypes({
      itemTypesToLoad: [
        {
          itemType: 'customers',
          create: createCustomer,
          update: updateCustomer,
        },
        {
          itemType: 'maple_kb',
          create: createMapleKB,
          update: updateMapleKB,
        },
      ],
    });

    await adapter.emit(LoaderEventType.DataLoadingDone, {
      reports,
      processed_files,
    });
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(LoaderEventType.DataLoadingProgress, {
      reports: adapter.reports,
      processed_files: adapter.processedFiles,
    });
  },
});
