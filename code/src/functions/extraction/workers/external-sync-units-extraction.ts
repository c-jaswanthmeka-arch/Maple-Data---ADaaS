import { ExternalSyncUnit, ExtractorEventType, processTask } from '@devrev/ts-adaas';

import { HttpClient } from '../../external-system/http-client';

processTask({
  task: async ({ adapter }) => {
    const httpClient = new HttpClient(adapter.event);

    // Fetch customers and maple kb to determine sync units
    const customers = await httpClient.getCustomers();
    const mapleKB = await httpClient.getMapleKB();
    
    console.log('Fetched customers:', customers.length);
    console.log('Fetched Maple KB articles:', mapleKB.length);

    // Create sync units for customers and maple kb
    const externalSyncUnits: ExternalSyncUnit[] = [
      {
        id: 'customers',
        name: 'Customers',
        description: 'Customer data from Maple data',
        item_count: customers.length,
        item_type: 'customers',
      },
      {
        id: 'maple-kb',
        name: 'Maple KB',
        description: 'Knowledge base articles from Maple data',
        item_count: mapleKB.length,
        item_type: 'maple_kb',
      },
    ];
    
    console.log('Created external sync units:', externalSyncUnits);
    console.log('Number of sync units:', externalSyncUnits.length);

    await adapter.emit(ExtractorEventType.ExtractionExternalSyncUnitsDone, {
      external_sync_units: externalSyncUnits,
    });
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(ExtractorEventType.ExtractionExternalSyncUnitsError, {
      error: {
        message: 'Failed to extract external sync units. Lambda timeout.',
      },
    });
  },
});
