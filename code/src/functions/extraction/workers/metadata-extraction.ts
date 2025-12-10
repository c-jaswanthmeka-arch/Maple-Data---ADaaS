import { ExtractorEventType, processTask } from '@devrev/ts-adaas';

import staticExternalDomainMetadata from '../../external-system/external_domain_metadata.json';

const repos = [
  {
    itemType: 'external_domain_metadata',
  },
];

processTask({
  task: async ({ adapter }) => {
    adapter.initializeRepos(repos);
    console.log('=== Starting Metadata Extraction ===');
    // Get the selected external sync unit ID from the event
    const selectedSyncUnitId = adapter.event.payload.event_context?.external_sync_unit_id;
    console.log(`Metadata extraction - Selected sync unit ID: ${selectedSyncUnitId}`);

    // Return all metadata for maple_data sync unit
    let filteredMetadata: typeof staticExternalDomainMetadata;
    
    if (selectedSyncUnitId === 'maple_data') {
      // Return all metadata for maple_data sync unit
      filteredMetadata = staticExternalDomainMetadata;
      console.log('Returning all record types for maple_data sync unit');
    } else {
      // If no sync unit selected or unknown, return all (fallback)
      filteredMetadata = staticExternalDomainMetadata;
      console.log('No specific sync unit selected or unknown, returning all record types');
    }
    console.log('Pushing filtered metadata to repository');
    await adapter.getRepo('external_domain_metadata')?.push([filteredMetadata]);
    console.log('Emitted metadata extraction done event');
    await adapter.emit(ExtractorEventType.ExtractionMetadataDone);
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(ExtractorEventType.ExtractionMetadataError, {
      error: { message: 'Failed to extract metadata. Lambda timeout.' },
    });
  },
});
