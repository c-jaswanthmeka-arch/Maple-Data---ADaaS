import {
  ExternalSystemAttachment,
  ExternalSystemItemLoadingParams,
  LoaderEventType,
  processTask,
} from '@devrev/ts-adaas';

import { LoaderState } from '../index';

/* eslint-disable @typescript-eslint/no-unused-vars */

// Note: Attachments are not needed for customers and Maple KB
// This file is kept for compatibility but the function is not implemented
async function createAttachment({ item, mappers, event }: ExternalSystemItemLoadingParams<ExternalSystemAttachment>) {
  return { error: 'Attachments not supported for Maple data.' };
}

processTask<LoaderState>({
  task: async ({ adapter }) => {
    const { reports, processed_files } = await adapter.loadAttachments({
      create: createAttachment,
    });

    await adapter.emit(LoaderEventType.AttachmentLoadingDone, {
      reports,
      processed_files,
    });
  },
  onTimeout: async ({ adapter }) => {
    await adapter.emit(LoaderEventType.AttachmentLoadingProgress, {
      reports: adapter.reports,
      processed_files: adapter.processedFiles,
    });
  },
});

