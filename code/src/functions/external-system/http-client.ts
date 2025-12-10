import { AirdropEvent, ExternalSystemItemLoadingResponse } from '@devrev/ts-adaas';
import axios from 'axios';
import { betaSDK, client } from '@devrev/typescript-sdk';
import { ExternalCustomer, ExternalMapleKB, ExternalPart, ExternalTicket, ExternalIssue, ExternalComment, ExternalUser, MapleKBArticleMetadata } from './types';
import {
  extractZip,
  readCustomersFromZip,
  readArticlesMetadataFromZip,
  readMarkdownFromZip,
  readPartsFromZip,
  readTicketsFromZip,
  readIssuesFromZip,
  readCommentsFromZip,
  readUsersFromZip,
} from './zip-utils';

export class HttpClient {
  private apiEndpoint: string;
  private apiToken: string;
  private zipExtractPath: string | null = null;
  private zipInitializationPromise: Promise<void> | null = null;

  constructor(event: AirdropEvent) {
    // TODO: Replace with API endpoint of the external system. This is passed through
    // the event payload.
    this.apiEndpoint = '<REPLACE_WITH_API_ENDPOINT>';

    // ZIP artifact ID is required in connection data
    // WORKAROUND: In Airdrop, only fields in secret_transform are passed to connection_data
    // So we store the artifact ID in the token field (which is passed as 'key' in connection_data)
    const connectionData = event.payload.connection_data as any;
    
    // Log connection data for debugging
    console.log('=== Connection Data Debug ===');
    console.log('Connection data keys:', Object.keys(connectionData || {}));
    console.log('Full connection data:', JSON.stringify(connectionData, null, 2));
    
    // Get artifact ID from connection_data.key (the token field)
    // The artifact ID should be entered directly in the "ZIP Artifact ID" field
    let zipArtifactId = connectionData?.key;
    
    // Also check for zip_artifact_id in case it's passed directly
    if (!zipArtifactId) {
      zipArtifactId = 
        connectionData?.zip_artifact_id || 
        connectionData?.zip_file ||
        connectionData?.artifact_id;
    }
    
    // Validate that it looks like an artifact ID (starts with 'don:')
    if (zipArtifactId && !zipArtifactId.startsWith('don:')) {
      console.warn(`Warning: Artifact ID doesn't start with 'don:'. Received: ${zipArtifactId}`);
    }
    
    // If still not found, throw error
    if (!zipArtifactId) {
      const errorMsg = `ZIP artifact ID is required but not found.

SOLUTION: In the connection, enter the artifact ID in the "ZIP Artifact ID" field.
Example: "don:core:dvrv-us-1:devo/YOUR_ORG:artifact/ARTIFACT_ID"

Connection data received:
${JSON.stringify(connectionData, null, 2)}`;
      
      console.error('=== ERROR: ZIP Artifact ID Not Found ===');
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log(`=== Found ZIP artifact ID: ${zipArtifactId} ===`);
    
    // No token needed - set to empty string
    this.apiToken = '';
    
    // Initialize ZIP extraction (will fetch from API if needed)
    this.zipInitializationPromise = this.initializeZip(zipArtifactId, event).catch((error) => {
      console.error('Error initializing ZIP file:', error);
      throw new Error(`Failed to initialize ZIP file: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  /**
   * Downloads and extracts the ZIP file from the artifact
   * If zipArtifactId is not provided, attempts to fetch it from the keyring API
   */
  private async initializeZip(zipArtifactId: string | null, event: AirdropEvent): Promise<void> {
    try {
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

      // If zip_artifact_id is not provided, try to fetch from keyring via API
      // In Airdrop, fields not in secret_transform may not be passed to connection_data
      if (!zipArtifactId) {
        console.log('=== zip_artifact_id not in connection_data, attempting to fetch from keyring API ===');
        
        try {
          // Get external system ID from event context
          const externalSystemId = event.payload.event_context?.external_system_id || 
                                   event.payload.event_context?.external_system;
          
          if (externalSystemId) {
            console.log(`Attempting to fetch keyring for external system: ${externalSystemId}`);
            
            // Try to use the keyrings API - note: this may not be available in all SDK versions
            // We'll use a direct API call as fallback
            try {
              // Use axios to call the keyrings API directly
              const keyringsResponse = await axios.post(
                `${event.execution_metadata.devrev_endpoint}/keyrings.list`,
                {
                  external_system: externalSystemId,
                },
                {
                  headers: {
                    'Authorization': `Bearer ${serviceAccountToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              
              if (keyringsResponse.data && keyringsResponse.data.keyrings && keyringsResponse.data.keyrings.length > 0) {
                const keyring = keyringsResponse.data.keyrings[0];
                console.log('Found keyring:', keyring.id);
                
                // Get the full keyring details
                const keyringGetResponse = await axios.post(
                  `${event.execution_metadata.devrev_endpoint}/keyrings.get`,
                  { id: keyring.id },
                  {
                    headers: {
                      'Authorization': `Bearer ${serviceAccountToken}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                
                if (keyringGetResponse.data && keyringGetResponse.data.keyring) {
                  const keyringData = keyringGetResponse.data.keyring;
                  // Check various possible locations for zip_artifact_id
                  const fieldValues = (keyringData as any).field_values || (keyringData as any).fields || (keyringData as any).values || {};
                  zipArtifactId = fieldValues.zip_artifact_id || fieldValues.zip_file || fieldValues.artifact_id;
                  
                  if (zipArtifactId) {
                    console.log(`✅ Found zip_artifact_id in keyring: ${zipArtifactId}`);
                  } else {
                    console.log('Keyring data structure:', JSON.stringify(keyringData, null, 2));
                  }
                }
              }
            } catch (apiError: any) {
              console.error('Error fetching keyring from API:', apiError?.response?.data || apiError?.message);
              // Continue to throw error below
            }
          }
        } catch (error) {
          console.error('Error in keyring fetch attempt:', error);
        }
        
        // If still not found, throw detailed error
        if (!zipArtifactId) {
          const errorDetails = {
            connection_data_keys: Object.keys(event.payload.connection_data || {}),
            connection_data: event.payload.connection_data,
            external_system_id: event.payload.event_context?.external_system_id,
            external_system: event.payload.event_context?.external_system,
          };
          console.error('=== ZIP Artifact ID Not Found ===');
          console.error('Error details:', JSON.stringify(errorDetails, null, 2));
          throw new Error(
            `ZIP artifact ID is required but not found in connection_data or keyring API.\n\n` +
            `In Airdrop, fields in secret_config.fields that are NOT in secret_transform may not be automatically passed.\n\n` +
            `SOLUTION: Ensure the connection is saved with zip_artifact_id in the "ZIP File" field.\n` +
            `The field value must be saved in the connection configuration before starting the Airdrop.\n\n` +
            `Connection data received: ${JSON.stringify(event.payload.connection_data, null, 2)}`
          );
        }
      }

      // Locate the artifact
      const locateResponse = await devrevSdk.artifactsLocate({ id: zipArtifactId });
      if (!locateResponse.data || !locateResponse.data.url) {
        throw new Error('Failed to locate ZIP artifact');
      }

      // Download the ZIP file
      const zipResponse = await axios.get(locateResponse.data.url, {
        responseType: 'arraybuffer',
      });

      // Extract the ZIP file
      const zipBuffer = Buffer.from(zipResponse.data, 'binary');
      this.zipExtractPath = extractZip(zipBuffer);
      
      console.log(`ZIP file extracted to: ${this.zipExtractPath}`);
      
      // Verify ZIP contents
      const fs = require('fs');
      const path = require('path');
      const extractedFiles = fs.readdirSync(this.zipExtractPath);
      console.log('Extracted ZIP contents:', extractedFiles);
      
      // Check for required files (customers and articles)
      const customersExists = fs.existsSync(path.join(this.zipExtractPath, 'customers.json'));
      const mapleKbExists = fs.existsSync(path.join(this.zipExtractPath, 'maple_kb'));
      const articlesExists = fs.existsSync(path.join(this.zipExtractPath, 'maple_kb', 'articles.json'));
      
      // Check for optional files (for future use - tickets, issues, comments, parts)
      const partsExists = fs.existsSync(path.join(this.zipExtractPath, 'maple_parts.json'));
      const ticketsExists = fs.existsSync(path.join(this.zipExtractPath, 'maple_tickets.json'));
      const issuesExists = fs.existsSync(path.join(this.zipExtractPath, 'maple_issues.json'));
      const commentsExists = fs.existsSync(path.join(this.zipExtractPath, 'maple_comments.json'));
      
      console.log(`=== ZIP File Contents ===`);
      console.log(`Required files:`);
      console.log(`  customers.json exists: ${customersExists}`);
      console.log(`  maple_kb directory exists: ${mapleKbExists}`);
      console.log(`  maple_kb/articles.json exists: ${articlesExists}`);
      console.log(`Optional files (will be ignored for now):`);
      console.log(`  maple_parts.json exists: ${partsExists}`);
      console.log(`  maple_tickets.json exists: ${ticketsExists}`);
      console.log(`  maple_issues.json exists: ${issuesExists}`);
      console.log(`  maple_comments.json exists: ${commentsExists}`);
      const usersExists = fs.existsSync(path.join(this.zipExtractPath, 'users.json'));
      console.log(`  users.json exists: ${usersExists}`);
      
      // Only validate required files (customers and articles)
      // Other files in ZIP are ignored for now
      if (!customersExists) {
        throw new Error('customers.json not found in ZIP file root');
      }
      if (!mapleKbExists) {
        throw new Error('maple_kb directory not found in ZIP file');
      }
      if (!articlesExists) {
        throw new Error('maple_kb/articles.json not found in ZIP file');
      }
      
      // Note: Other files (tickets, issues, comments, parts) are optional and will be ignored
      // They can be in the ZIP but won't cause errors if missing
    } catch (error) {
      console.error('Error downloading/extracting ZIP file:', error);
      throw error;
    }
  }

  /**
   * Ensures ZIP initialization is complete before reading files
   */
  private async ensureZipInitialized(): Promise<void> {
    if (this.zipInitializationPromise) {
      await this.zipInitializationPromise;
    }
  }

  // Fetch customers from ZIP file
  async getCustomers(): Promise<ExternalCustomer[]> {
    // Wait for ZIP initialization
    await this.ensureZipInitialized();
    
    if (!this.zipExtractPath) {
      throw new Error('ZIP file not extracted. Cannot read customers.json');
    }
    
    const customers = readCustomersFromZip(this.zipExtractPath);
    if (!customers) {
      throw new Error('customers.json not found in ZIP file. Please ensure customers.json exists in the root of the ZIP file.');
    }
    
    return customers as ExternalCustomer[];
  }

  // Fetch Maple KB articles from ZIP file
  async getMapleKB(): Promise<ExternalMapleKB[]> {
    // Wait for ZIP initialization
    await this.ensureZipInitialized();
    
    if (!this.zipExtractPath) {
      throw new Error('ZIP file not extracted. Cannot read Maple KB articles.');
    }
    
    // Read articles metadata from ZIP
    const zipArticles = readArticlesMetadataFromZip(this.zipExtractPath);
    if (!zipArticles) {
      throw new Error('articles.json not found in ZIP file. Please ensure maple_kb/articles.json exists in the ZIP file.');
    }
    
    const articlesMetadataToUse = zipArticles as MapleKBArticleMetadata[];
    
    // Read markdown files from ZIP
    const articles: ExternalMapleKB[] = articlesMetadataToUse.map((article) => {
      const content = readMarkdownFromZip(this.zipExtractPath!, article.content_file);
      
      if (!content) {
        console.warn(`Warning: Markdown file ${article.content_file} not found in ZIP or is empty`);
      }

      return {
        id: article.id,
        created_date: article.created_date,
        modified_date: article.modified_date,
        title: article.title,
        content: content || `Content not found: ${article.content_file}`,
        category: article.category,
      };
    });

    return articles;
  }

  // Fetch parts from ZIP file
  async getParts(): Promise<ExternalPart[]> {
    // Wait for ZIP initialization
    await this.ensureZipInitialized();
    
    if (!this.zipExtractPath) {
      throw new Error('ZIP file not extracted. Cannot read parts.');
    }
    
    const parts = readPartsFromZip(this.zipExtractPath);
    if (!parts) {
      // Parts are optional, return empty array if not found
      console.log('maple_parts.json not found in ZIP file. Parts will be skipped.');
      return [];
    }
    
    return parts as ExternalPart[];
  }

  // Fetch tickets from ZIP file
  async getTickets(): Promise<ExternalTicket[]> {
    // Wait for ZIP initialization
    await this.ensureZipInitialized();
    
    if (!this.zipExtractPath) {
      throw new Error('ZIP file not extracted. Cannot read tickets.');
    }
    
    const tickets = readTicketsFromZip(this.zipExtractPath);
    if (!tickets) {
      // Tickets are optional, return empty array if not found
      console.log('maple_tickets.json not found in ZIP file. Tickets will be skipped.');
      return [];
    }
    
    return tickets as ExternalTicket[];
  }

  // Fetch issues from ZIP file
  async getIssues(): Promise<ExternalIssue[]> {
    // Wait for ZIP initialization
    await this.ensureZipInitialized();
    
    if (!this.zipExtractPath) {
      throw new Error('ZIP file not extracted. Cannot read issues.');
    }
    
    const issues = readIssuesFromZip(this.zipExtractPath);
    if (!issues) {
      // Issues are optional, return empty array if not found
      console.log('maple_issues.json not found in ZIP file. Issues will be skipped.');
      return [];
    }
    
    return issues as ExternalIssue[];
  }

  // Fetch comments from ZIP file
  async getComments(): Promise<ExternalComment[]> {
    // Wait for ZIP initialization
    await this.ensureZipInitialized();
    
    if (!this.zipExtractPath) {
      throw new Error('ZIP file not extracted. Cannot read comments.');
    }
    
    const comments = readCommentsFromZip(this.zipExtractPath);
    if (!comments) {
      // Comments are optional, return empty array if not found
      console.log('maple_comments.json not found in ZIP file. Comments will be skipped.');
      return [];
    }
    
    return comments as ExternalComment[];
  }

  async getUsers(): Promise<ExternalUser[]> {
    // Wait for ZIP initialization
    await this.ensureZipInitialized();
    
    if (!this.zipExtractPath) {
      throw new Error('ZIP file not extracted. Cannot read users.');
    }
    
    const users = readUsersFromZip(this.zipExtractPath);
    if (!users) {
      // Users are optional, return empty array if not found
      console.log('users.json not found in ZIP file. Users will be skipped.');
      return [];
    }
    
    return users as ExternalUser[];
  }

  // TODO: Replace with the actual function to create an item in the external system.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createCustomer(customer: ExternalCustomer): Promise<ExternalSystemItemLoadingResponse> {
    return { error: 'Could not create customer in external system.' };
  }

  // TODO: Replace with the actual function to update an item in the external system.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateCustomer(customer: ExternalCustomer): Promise<ExternalSystemItemLoadingResponse> {
    return { error: 'Could not update customer in external system.' };
  }

  // TODO: Replace with the actual function to create an item in the external system.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createMapleKB(kb: ExternalMapleKB): Promise<ExternalSystemItemLoadingResponse> {
    return { error: 'Could not create Maple KB article in external system.' };
  }

  // TODO: Replace with the actual function to update an item in the external system.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateMapleKB(kb: ExternalMapleKB): Promise<ExternalSystemItemLoadingResponse> {
    return { error: 'Could not update Maple KB article in external system.' };
  }

  // TODO: Replace with the actual function to create an item in the external system.
  // Note: Parts are created directly in DevRev via the loader, not through this method.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createPart(part: ExternalPart): Promise<ExternalSystemItemLoadingResponse> {
    return { error: 'Could not create part in external system.' };
  }

  // TODO: Replace with the actual function to update an item in the external system.
  // Note: Parts are updated directly in DevRev via the loader, not through this method.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updatePart(part: ExternalPart): Promise<ExternalSystemItemLoadingResponse> {
    return { error: 'Could not update part in external system.' };
  }
}
