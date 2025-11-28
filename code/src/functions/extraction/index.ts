import { AirdropEvent, EventType, spawn } from '@devrev/ts-adaas';

import initialDomainMapping from '../external-system/initial_domain_mapping.json';

// State interface to track extraction progress
export interface ExtractorState {
  customers: { completed: boolean };
  maple_kb: { completed: boolean };
}

// Initial state for extraction process
export const initialExtractorState: ExtractorState = {
  customers: { completed: false },
  maple_kb: { completed: false },
};

function getWorkerPerExtractionPhase(event: AirdropEvent) {
  let path;
  switch (event.payload.event_type) {
    case EventType.ExtractionExternalSyncUnitsStart:
      path = __dirname + '/workers/external-sync-units-extraction';
      break;
    case EventType.ExtractionMetadataStart:
      path = __dirname + '/workers/metadata-extraction';
      break;
    case EventType.ExtractionDataStart:
    case EventType.ExtractionDataContinue:
      path = __dirname + '/workers/data-extraction';
      break;
    case EventType.ExtractionAttachmentsStart:
    case EventType.ExtractionAttachmentsContinue:
      path = __dirname + '/workers/attachments-extraction';
      break;
  }
  return path;
}

const run = async (events: AirdropEvent[]) => {
  for (const event of events) {
    const file = getWorkerPerExtractionPhase(event);
    await spawn<ExtractorState>({
      event,
      initialState: initialExtractorState,
      workerPath: file,
      initialDomainMapping,

      // TODO: If needed you can pass additional options to the spawn function.
      // For example timeout of the lambda, batch size, etc.
      // options: {
      //   timeout: 1 * 1000 * 60, // 1 minute
      //   batchSize: 50, // 50 items per batch
      // },
    });
  }
};

export default run;
