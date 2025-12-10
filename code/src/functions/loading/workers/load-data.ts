import {
  ExternalSystemItem,
  ExternalSystemItemLoadingParams,
  ExternalSystemItemLoadingResponse,
  LoaderEventType,
  processTask,
} from '@devrev/ts-adaas';

import { denormalizeCustomer, denormalizeMapleKB, denormalizePart, denormalizeTicket, denormalizeIssue, denormalizeComment, denormalizeUser } from '../../external-system/data-denormalization';
import { HttpClient } from '../../external-system/http-client';
import { LoaderState } from '../index';
import { betaSDK, client } from '@devrev/typescript-sdk';

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

// Create function for Parts
async function createPart({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const part = denormalizePart(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Map part type from external system to DevRev part type
    let devrevPartType: betaSDK.PartType;
    switch (part.type) {
      case 'product':
        devrevPartType = betaSDK.PartType.Product;
        break;
      case 'feature_area':
        devrevPartType = betaSDK.PartType.Capability;
        break;
      case 'feature':
        devrevPartType = betaSDK.PartType.Feature;
        break;
      case 'capability':
        devrevPartType = betaSDK.PartType.Capability;
        break;
      default:
        devrevPartType = betaSDK.PartType.Feature;
    }

    // Build the parts create request
    const partsCreateRequest: any = {
      name: part.title,
      type: devrevPartType,
      description: part.description,
    };

    // Resolve parent part ID if parent is specified
    if (part.parent) {
      const partsMapper = (mappers as any)?.parts;
      const parentDevrevId = partsMapper?.get(part.parent);
      if (parentDevrevId) {
        partsCreateRequest.parent_part = [parentDevrevId];
      } else {
        console.warn(`Warning: Parent part ${part.parent} not found in mappers. Creating part without parent.`);
      }
    }

    // Resolve owner ID if owner_id is specified
    if (part.owner_id) {
      const usersMapper = (mappers as any)?.users;
      const ownerDevrevId = usersMapper?.get(part.owner_id);
      if (ownerDevrevId) {
        partsCreateRequest.owned_by = [ownerDevrevId];
      } else {
        console.warn(`Warning: Owner ${part.owner_id} not found in mappers. Creating part without owner.`);
      }
    }

    const response = await devrevSdk.partsCreate(partsCreateRequest);
    
    if (response.data && response.data.part) {
      return {
        id: response.data.part.id,
      };
    } else {
      return { error: 'Failed to create part in DevRev' };
    }
  } catch (error: any) {
    console.error('Error creating part in DevRev:', error);
    return {
      error: error?.message || 'Could not create part in DevRev',
    };
  }
}

// Update function for Parts
async function updatePart({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const part = denormalizePart(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Get the DevRev part ID from the item
    const devrevPartId = item.id.devrev;
    if (!devrevPartId) {
      return { error: 'DevRev part ID not found. Cannot update part.' };
    }

    // Map part type from external system to DevRev part type
    let devrevPartType: betaSDK.PartType;
    switch (part.type) {
      case 'product':
        devrevPartType = betaSDK.PartType.Product;
        break;
      case 'feature_area':
        devrevPartType = betaSDK.PartType.Capability;
        break;
      case 'feature':
        devrevPartType = betaSDK.PartType.Feature;
        break;
      case 'capability':
        devrevPartType = betaSDK.PartType.Capability;
        break;
      default:
        devrevPartType = betaSDK.PartType.Feature;
    }

    // Build the parts update request
    const partsUpdateRequest: any = {
      id: devrevPartId,
      name: part.title,
      type: devrevPartType,
      description: part.description,
    };

    // Resolve parent part ID if parent is specified
    if (part.parent) {
      const partsMapper = (mappers as any)?.parts;
      const parentDevrevId = partsMapper?.get(part.parent);
      if (parentDevrevId) {
        partsUpdateRequest.parent_part = [parentDevrevId];
      }
    }

    // Resolve owner ID if owner_id is specified
    if (part.owner_id) {
      const usersMapper = (mappers as any)?.users;
      const ownerDevrevId = usersMapper?.get(part.owner_id);
      if (ownerDevrevId) {
        partsUpdateRequest.owned_by = [ownerDevrevId];
      } else {
        console.warn(`Warning: Owner ${part.owner_id} not found in mappers. Updating part without owner.`);
      }
    }

    const response = await devrevSdk.partsUpdate(partsUpdateRequest);
    
    if (response.data && response.data.part) {
      return {
        id: response.data.part.id,
      };
    } else {
      return { error: 'Failed to update part in DevRev' };
    }
  } catch (error: any) {
    console.error('Error updating part in DevRev:', error);
    return {
      error: error?.message || 'Could not update part in DevRev',
    };
  }
}

// Create function for Tickets
async function createTicket({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const ticket = denormalizeTicket(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Build the works create request (tickets are works in DevRev)
    const worksCreateRequest: any = {
      title: ticket.subject,
      body: ticket.description,
      type: betaSDK.WorkType.Ticket,
    };

    // Map priority to severity
    if (ticket.priority) {
      const severityMap: Record<string, string> = {
        'Critical': 'blocker',
        'High': 'high',
        'Medium': 'medium',
        'Low': 'low',
      };
      worksCreateRequest.severity = severityMap[ticket.priority] || 'medium';
    }

    // Map status to stage (custom stages will be created)
    if (ticket.status) {
      worksCreateRequest.stage = ticket.status;
    }

    // Resolve account ID if account_id is specified
    if (ticket.account_id) {
      const accountsMapper = (mappers as any)?.customers;
      const accountDevrevId = accountsMapper?.get(ticket.account_id);
      if (accountDevrevId) {
        worksCreateRequest.account = accountDevrevId;
      }
    }

    // Resolve owner ID if owner_id is specified
    if (ticket.owner_id) {
      worksCreateRequest.owned_by = [ticket.owner_id];
    }

    // Resolve reported_by if contact_id is specified
    if (ticket.contact_id) {
      worksCreateRequest.reported_by = [ticket.contact_id];
    }

    const response = await devrevSdk.worksCreate(worksCreateRequest);
    
    if (response.data && response.data.work) {
      return {
        id: response.data.work.id,
      };
    } else {
      return { error: 'Failed to create ticket in DevRev' };
    }
  } catch (error: any) {
    console.error('Error creating ticket in DevRev:', error);
    return {
      error: error?.message || 'Could not create ticket in DevRev',
    };
  }
}

// Update function for Tickets
async function updateTicket({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const ticket = denormalizeTicket(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Get the DevRev ticket ID from the item
    const devrevTicketId = item.id.devrev;
    if (!devrevTicketId) {
      return { error: 'DevRev ticket ID not found. Cannot update ticket.' };
    }

    // Build the works update request
    const worksUpdateRequest: any = {
      id: devrevTicketId,
      title: ticket.subject,
      body: ticket.description,
    };

    // Map priority to severity
    if (ticket.priority) {
      const severityMap: Record<string, string> = {
        'Critical': 'blocker',
        'High': 'high',
        'Medium': 'medium',
        'Low': 'low',
      };
      worksUpdateRequest.severity = severityMap[ticket.priority] || 'medium';
    }

    // Map status to stage
    if (ticket.status) {
      worksUpdateRequest.stage = ticket.status;
    }

    const response = await devrevSdk.worksUpdate(worksUpdateRequest);
    
    if (response.data && response.data.work) {
      return {
        id: response.data.work.id,
      };
    } else {
      return { error: 'Failed to update ticket in DevRev' };
    }
  } catch (error: any) {
    console.error('Error updating ticket in DevRev:', error);
    return {
      error: error?.message || 'Could not update ticket in DevRev',
    };
  }
}

// Create function for Issues
async function createIssue({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const issue = denormalizeIssue(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Build the works create request (issues are also tickets/works in DevRev)
    const worksCreateRequest: any = {
      title: issue.subject,
      body: issue.description,
      type: betaSDK.WorkType.Ticket,
    };

    // Map impact to severity
    if (issue.impact) {
      const severityMap: Record<string, string> = {
        'High': 'high',
        'Medium': 'medium',
        'Low': 'low',
      };
      worksCreateRequest.severity = severityMap[issue.impact] || 'medium';
    }

    // Map status to stage
    if (issue.status) {
      worksCreateRequest.stage = issue.status;
    }

    // Resolve owner ID if owner_id is specified
    if (issue.owner_id) {
      worksCreateRequest.owned_by = [issue.owner_id];
    }

    const response = await devrevSdk.worksCreate(worksCreateRequest);
    
    if (response.data && response.data.work) {
      return {
        id: response.data.work.id,
      };
    } else {
      return { error: 'Failed to create issue in DevRev' };
    }
  } catch (error: any) {
    console.error('Error creating issue in DevRev:', error);
    return {
      error: error?.message || 'Could not create issue in DevRev',
    };
  }
}

// Update function for Issues
async function updateIssue({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const issue = denormalizeIssue(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Get the DevRev ticket ID from the item
    const devrevTicketId = item.id.devrev;
    if (!devrevTicketId) {
      return { error: 'DevRev issue ID not found. Cannot update issue.' };
    }

    // Build the works update request
    const worksUpdateRequest: any = {
      id: devrevTicketId,
      title: issue.subject,
      body: issue.description,
    };

    // Map impact to severity
    if (issue.impact) {
      const severityMap: Record<string, string> = {
        'High': 'high',
        'Medium': 'medium',
        'Low': 'low',
      };
      worksUpdateRequest.severity = severityMap[issue.impact] || 'medium';
    }

    // Map status to stage
    if (issue.status) {
      worksUpdateRequest.stage = issue.status;
    }

    const response = await devrevSdk.worksUpdate(worksUpdateRequest);
    
    if (response.data && response.data.work) {
      return {
        id: response.data.work.id,
      };
    } else {
      return { error: 'Failed to update issue in DevRev' };
    }
  } catch (error: any) {
    console.error('Error updating issue in DevRev:', error);
    return {
      error: error?.message || 'Could not update issue in DevRev',
    };
  }
}

// Create function for Comments
async function createComment({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const comment = denormalizeComment(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Resolve parent object ID from mappers
    // Comments can be attached to tickets, issues, or other objects
    let parentObjectId: string | undefined;
    
    // Try to find parent in various mappers
    const ticketsMapper = (mappers as any)?.tickets;
    const issuesMapper = (mappers as any)?.issues;
    
    parentObjectId = ticketsMapper?.get(comment.parent_id) || issuesMapper?.get(comment.parent_id);
    
    if (!parentObjectId) {
      // If not found in mappers, use the parent_id directly (assuming it's already a DevRev ID)
      parentObjectId = comment.parent_id;
    }

    if (!parentObjectId) {
      return { error: 'Parent object ID not found. Cannot create comment.' };
    }

    // Build the timeline entries create request (comments are timeline entries in DevRev)
    const timelineEntriesCreateRequest: any = {
      object: parentObjectId,
      body: comment.body,
      body_type: betaSDK.TimelineCommentBodyType.Text,
      type: betaSDK.TimelineEntriesCreateRequestType.TimelineComment,
    };

    // Set visibility if specified
    if (comment.visibility) {
      const visibilityMap: Record<string, betaSDK.TimelineEntryVisibility> = {
        'Visibility_EXTERNAL': betaSDK.TimelineEntryVisibility.External,
        'Visibility_INTERNAL': betaSDK.TimelineEntryVisibility.Internal,
      };
      timelineEntriesCreateRequest.visibility = visibilityMap[comment.visibility] || betaSDK.TimelineEntryVisibility.Internal;
    }

    const response = await devrevSdk.timelineEntriesCreate(timelineEntriesCreateRequest);
    
    if (response.data && response.data.timeline_entry) {
      return {
        id: response.data.timeline_entry.id,
      };
    } else {
      return { error: 'Failed to create comment in DevRev' };
    }
  } catch (error: any) {
    console.error('Error creating comment in DevRev:', error);
    return {
      error: error?.message || 'Could not create comment in DevRev',
    };
  }
}

// Update function for Comments
async function updateComment({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const comment = denormalizeComment(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Get the DevRev comment ID from the item
    const devrevCommentId = item.id.devrev;
    if (!devrevCommentId) {
      return { error: 'DevRev comment ID not found. Cannot update comment.' };
    }

    // Build the timeline entries update request
    const timelineEntriesUpdateRequest: any = {
      id: devrevCommentId,
      body: comment.body,
    };

    // Set visibility if specified
    if (comment.visibility) {
      const visibilityMap: Record<string, betaSDK.TimelineEntryVisibility> = {
        'Visibility_EXTERNAL': betaSDK.TimelineEntryVisibility.External,
        'Visibility_INTERNAL': betaSDK.TimelineEntryVisibility.Internal,
      };
      timelineEntriesUpdateRequest.visibility = visibilityMap[comment.visibility] || betaSDK.TimelineEntryVisibility.Internal;
    }

    const response = await devrevSdk.timelineEntriesUpdate(timelineEntriesUpdateRequest);
    
    if (response.data && response.data.timeline_entry) {
      return {
        id: response.data.timeline_entry.id,
      };
    } else {
      return { error: 'Failed to update comment in DevRev' };
    }
  } catch (error: any) {
    console.error('Error updating comment in DevRev:', error);
    return {
      error: error?.message || 'Could not update comment in DevRev',
    };
  }
}

// Create function for Users
async function createUser({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const user = denormalizeUser(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Build the dev users create request
    const devUsersCreateRequest: any = {
      email: user.email,
      display_name: user.full_name,
    };

    // Set state if specified
    if (user.state) {
      devUsersCreateRequest.state = user.state;
    }

    // Set phone numbers if specified
    if (user.phone_numbers && user.phone_numbers.length > 0) {
      devUsersCreateRequest.phone_numbers = user.phone_numbers;
    }

    const response = await devrevSdk.devUsersCreate(devUsersCreateRequest);
    
    if (response.data && response.data.dev_user) {
      return {
        id: response.data.dev_user.id,
      };
    } else {
      return { error: 'Failed to create user in DevRev' };
    }
  } catch (error: any) {
    console.error('Error creating user in DevRev:', error);
    return {
      error: error?.message || 'Could not create user in DevRev',
    };
  }
}

// Update function for Users
async function updateUser({
  item,
  mappers,
  event,
}: ExternalSystemItemLoadingParams<ExternalSystemItem>): Promise<ExternalSystemItemLoadingResponse> {
  try {
    const user = denormalizeUser(item);
    
    // Get service account token from event context
    const serviceAccountToken = (event as any).context?.secrets?.service_account_token;
    if (!serviceAccountToken) {
      throw new Error('Service account token not available');
    }

    // Initialize DevRev SDK
    const devrevSdk = client.setupBeta({
      endpoint: event.execution_metadata.devrev_endpoint,
      token: serviceAccountToken,
    });

    // Get the DevRev user ID from the item
    const devrevUserId = item.id.devrev;
    if (!devrevUserId) {
      return { error: 'DevRev user ID not found. Cannot update user.' };
    }

    // Build the dev users update request
    const devUsersUpdateRequest: any = {
      id: devrevUserId,
      display_name: user.full_name,
    };

    // Set state if specified
    if (user.state) {
      devUsersUpdateRequest.state = user.state;
    }

    // Set phone numbers if specified
    if (user.phone_numbers && user.phone_numbers.length > 0) {
      devUsersUpdateRequest.phone_numbers = user.phone_numbers;
    }

    const response = await devrevSdk.devUsersUpdate(devUsersUpdateRequest);
    
    if (response.data && response.data.dev_user) {
      return {
        id: response.data.dev_user.id,
      };
    } else {
      return { error: 'Failed to update user in DevRev' };
    }
  } catch (error: any) {
    console.error('Error updating user in DevRev:', error);
    return {
      error: error?.message || 'Could not update user in DevRev',
    };
  }
}

processTask<LoaderState>({
  task: async ({ adapter }) => {
    const { reports, processed_files } = await adapter.loadItemTypes({
      itemTypesToLoad: [
        // Load users first - needed for owner_id references in other objects
        {
          itemType: 'users',
          create: createUser,
          update: updateUser,
        },
        // Load parts second - parent parts need to exist before child parts
        {
          itemType: 'parts',
          create: createPart,
          update: updatePart,
        },
        // Load customers third - accounts
        {
          itemType: 'customers',
          create: createCustomer,
          update: updateCustomer,
        },
        // Load articles fourth
        {
          itemType: 'maple_kb',
          create: createMapleKB,
          update: updateMapleKB,
        },
        // Load tickets fifth - after users and parts
        {
          itemType: 'tickets',
          create: createTicket,
          update: updateTicket,
        },
        // Load issues sixth - after users and parts
        {
          itemType: 'issues',
          create: createIssue,
          update: updateIssue,
        },
        // Load comments last - after tickets and issues they reference
        {
          itemType: 'comments',
          create: createComment,
          update: updateComment,
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
