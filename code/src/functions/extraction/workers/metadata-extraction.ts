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

    // Get the selected external sync unit ID from the event
    const selectedSyncUnitId = adapter.event.payload.event_context?.external_sync_unit_id;
    console.log(`Metadata extraction - Selected sync unit ID: ${selectedSyncUnitId}`);

    // Map sync unit IDs to record types
    const syncUnitToRecordType: { [key: string]: 'customers' | 'maple_kb' } = {
      'customers': 'customers',
      'maple-kb': 'maple_kb',
    };

    // Filter metadata based on selected sync unit
    let filteredMetadata: typeof staticExternalDomainMetadata;
    
    if (selectedSyncUnitId && syncUnitToRecordType[selectedSyncUnitId]) {
      // Only include the record type for the selected sync unit
      const selectedRecordType = syncUnitToRecordType[selectedSyncUnitId];
      filteredMetadata = {
        schema_version: staticExternalDomainMetadata.schema_version,
        record_types: {
          [selectedRecordType]: staticExternalDomainMetadata.record_types[selectedRecordType],
        } as any,
      };
      console.log(`Filtering metadata to: ${selectedRecordType} (sync unit: ${selectedSyncUnitId})`);
    } else {
      // If no sync unit selected or unknown, return all (fallback)
      filteredMetadata = staticExternalDomainMetadata;
      console.log('No specific sync unit selected, returning all record types');
    }

    await adapter.getRepo('external_domain_metadata')?.push([filteredMetadata]);
    await adapter.emit(ExtractorEventType.ExtractionMetadataDone);
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(ExtractorEventType.ExtractionMetadataError, {
      error: { message: 'Failed to extract metadata. Lambda timeout.' },
    });
  },
});
