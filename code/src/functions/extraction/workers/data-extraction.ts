import { ExtractorEventType, processTask } from '@devrev/ts-adaas';

import { normalizeCustomer, normalizeMapleKB } from '../../external-system/data-normalization';
import { HttpClient } from '../../external-system/http-client';
import { ExtractorState } from '../index';
import { ExternalCustomer, ExternalMapleKB } from '../../external-system/types';

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
];

// Item types to extract
interface ItemTypeToExtract {
  name: 'customers' | 'maple_kb';
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
];

processTask<ExtractorState>({
  task: async ({ adapter }) => {
    adapter.initializeRepos(repos);

    const httpClient = new HttpClient(adapter.event);

    // Extract customers and maple kb data
    for (const itemTypeToExtract of itemTypesToExtract) {
      const items = await itemTypeToExtract.extractFunction(httpClient);
      await adapter.getRepo(itemTypeToExtract.name)?.push(items);
      adapter.state[itemTypeToExtract.name].completed = true;
    }

    await adapter.emit(ExtractorEventType.ExtractionDataDone);
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(ExtractorEventType.ExtractionDataProgress);
  },
});
