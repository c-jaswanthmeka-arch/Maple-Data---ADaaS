import { ExtractorEventType, processTask } from '@devrev/ts-adaas';

import { normalizeCustomer, normalizeMapleKB, normalizeTicket, normalizeIssue, normalizePart, normalizeComment, normalizeUser } from '../../external-system/data-normalization';
import { HttpClient } from '../../external-system/http-client';
import { ExtractorState } from '../index';
import { ExternalCustomer, ExternalMapleKB, ExternalTicket, ExternalIssue, ExternalPart, ExternalComment, ExternalUser } from '../../external-system/types';

// Repos for storing extracted data
const repos = [
  {
    itemType: 'customers',
    normalize: (item: object) => normalizeCustomer(item as ExternalCustomer),
  },
  {
    itemType: 'maple_kb',
    normalize: (item: object) => normalizeMapleKB(item as ExternalMapleKB),
  },
  {
    itemType: 'tickets',
    normalize: (item: object) => normalizeTicket(item as ExternalTicket),
  },
  {
    itemType: 'issues',
    normalize: (item: object) => normalizeIssue(item as ExternalIssue),
  },
  {
    itemType: 'parts',
    normalize: (item: object) => normalizePart(item as ExternalPart),
  },
  {
    itemType: 'comments',
    normalize: (item: object) => normalizeComment(item as ExternalComment),
  },
  {
    itemType: 'users',
    normalize: (item: object) => normalizeUser(item as ExternalUser),
  },
];

// Item types to extract
interface ItemTypeToExtract {
  name: 'customers' | 'maple_kb' | 'tickets' | 'issues' | 'parts' | 'comments' | 'users';
  extractFunction: (client: HttpClient) => Promise<object[]>;
}

const itemTypesToExtract: ItemTypeToExtract[] = [
  {
    name: 'customers',
    extractFunction: (client: HttpClient) => client.getCustomers(),
  },
  {
    name: 'maple_kb',
    extractFunction: (client: HttpClient) => client.getMapleKB(),
  },
  {
    name: 'tickets',
    extractFunction: (client: HttpClient) => client.getTickets(),
  },
  {
    name: 'issues',
    extractFunction: (client: HttpClient) => client.getIssues(),
  },
  {
    name: 'parts',
    extractFunction: (client: HttpClient) => client.getParts(),
  },
  {
    name: 'comments',
    extractFunction: (client: HttpClient) => client.getComments(),
  },
  {
    name: 'users',
    extractFunction: (client: HttpClient) => client.getUsers(),
  },
];

processTask<ExtractorState>({
  task: async ({ adapter }) => {
    try {
      adapter.initializeRepos(repos);

      const httpClient = new HttpClient(adapter.event);

      // Get the selected external sync unit ID from the event
      const selectedSyncUnitId = adapter.event.payload.event_context?.external_sync_unit_id;
      console.log(`Selected sync unit ID: ${selectedSyncUnitId}`);

      // Determine which item types to extract based on selected sync unit
      let itemTypesToExtractNow: ItemTypeToExtract[];
      
      if (selectedSyncUnitId === 'maple_data') {
        // Extract all data types for maple_data sync unit
        console.log('Extracting all data types for maple_data sync unit');
        itemTypesToExtractNow = itemTypesToExtract;
      } else {
        // If no sync unit selected or unknown, extract all (fallback)
        console.log('No specific sync unit selected or unknown, extracting all item types');
        itemTypesToExtractNow = itemTypesToExtract;
      }

      // Extract data for the selected sync unit(s)
      for (const itemTypeToExtract of itemTypesToExtractNow) {
        try {
          console.log(`Starting extraction for: ${itemTypeToExtract.name}`);
          const items = await itemTypeToExtract.extractFunction(httpClient);
          console.log(`Extracted ${items.length} items for ${itemTypeToExtract.name}`);
          await adapter.getRepo(itemTypeToExtract.name)?.push(items);
          adapter.state[itemTypeToExtract.name].completed = true;
        } catch (error) {
          console.error(`Error extracting ${itemTypeToExtract.name}:`, error);
          throw error;
        }
      }

      await adapter.emit(ExtractorEventType.ExtractionDataDone);
    } catch (error: any) {
      console.error('=== ERROR in Data Extraction ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // ExtractionDataError format - just pass the error message as a string
      const errorMessage = error instanceof Error ? error.message : String(error);
      await adapter.emit(ExtractorEventType.ExtractionDataError, errorMessage as any);
    }
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(ExtractorEventType.ExtractionDataProgress);
  },
});
