import { ExternalSyncUnit, ExtractorEventType, processTask } from '@devrev/ts-adaas';

import { HttpClient } from '../../external-system/http-client';

processTask({
  task: async ({ adapter }) => {
    try {
      console.log('=== Starting External Sync Units Extraction ===');
      console.log('Event payload:', JSON.stringify(adapter.event.payload, null, 2));
      
      const httpClient = new HttpClient(adapter.event);

      // Fetch all data types to determine sync units
      console.log('Fetching customers...');
      const customers = await httpClient.getCustomers();
      console.log('Fetched customers:', customers.length);
      
      console.log('Fetching Maple KB...');
      const mapleKB = await httpClient.getMapleKB();
      console.log('Fetched Maple KB articles:', mapleKB.length);

      console.log('Fetching tickets...');
      const tickets = await httpClient.getTickets();
      console.log('Fetched tickets:', tickets.length);

      console.log('Fetching issues...');
      const issues = await httpClient.getIssues();
      console.log('Fetched issues:', issues.length);

      console.log('Fetching parts...');
      const parts = await httpClient.getParts();
      console.log('Fetched parts:', parts.length);

      console.log('Fetching comments...');
      const comments = await httpClient.getComments();
      console.log('Fetched comments:', comments.length);

      console.log('Fetching users...');
      const users = await httpClient.getUsers();
      console.log('Fetched users:', users.length);

      // Calculate total item count
      const totalItemCount = customers.length + mapleKB.length + tickets.length + 
                            issues.length + parts.length + comments.length + users.length;

      // Create a single sync unit for all Maple data
      const externalSyncUnits: ExternalSyncUnit[] = [
        {
          id: 'maple_data',
          name: 'Maple Data',
          description: 'All data from Maple data (customers, articles, tickets, issues, parts, comments, users)',
          item_count: totalItemCount,
          item_type: 'maple_data',
        },
      ];
      
      console.log('Created external sync units:', JSON.stringify(externalSyncUnits, null, 2));
      console.log('Number of sync units:', externalSyncUnits.length);

      await adapter.emit(ExtractorEventType.ExtractionExternalSyncUnitsDone, {
        external_sync_units: externalSyncUnits,
      });
    } catch (error: any) {
      console.error('=== ERROR in External Sync Units Extraction ===');
      console.error('Error details:', error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      await adapter.emit(ExtractorEventType.ExtractionExternalSyncUnitsError, {
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(ExtractorEventType.ExtractionExternalSyncUnitsError, {
      error: {
        message: 'Failed to extract external sync units. Lambda timeout.',
      },
    });
  },
});
