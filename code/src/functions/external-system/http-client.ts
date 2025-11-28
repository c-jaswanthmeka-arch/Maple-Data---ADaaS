import { AirdropEvent, ExternalSystemItemLoadingResponse } from '@devrev/ts-adaas';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ExternalCustomer, ExternalMapleKB, MapleKBArticleMetadata } from './types';
import customersData from './customers.json';
import articlesMetadata from './maple_kb/articles.json';

export class HttpClient {
  private apiEndpoint: string;
  private apiToken: string;
  private mapleKBDir: string;

  constructor(event: AirdropEvent) {
    // TODO: Replace with API endpoint of the external system. This is passed through
    // the event payload.
    this.apiEndpoint = '<REPLACE_WITH_API_ENDPOINT>';

    // TODO: Replace with API token of the external system. This is passed
    // through the event payload. Configuration for the token is defined in manifest.yaml.
    this.apiToken = event.payload.connection_data.key;
    
    // Set path to maple_kb directory
    this.mapleKBDir = join(__dirname, 'maple_kb');
  }

  // Fetch customers from JSON file
  async getCustomers(): Promise<ExternalCustomer[]> {
    return new Promise((resolve) => {
      resolve(customersData as ExternalCustomer[]);
    });
  }

  // Fetch Maple KB articles from articles.json and load markdown files
  async getMapleKB(): Promise<ExternalMapleKB[]> {
    return new Promise((resolve) => {
      try {
        const articles: ExternalMapleKB[] = (articlesMetadata as MapleKBArticleMetadata[]).map((article) => {
          // Read the markdown file content
          const markdownPath = join(this.mapleKBDir, article.content_file);
          let content = '';
          
          try {
            content = readFileSync(markdownPath, 'utf-8');
          } catch (error) {
            console.error(`Error reading markdown file ${article.content_file}:`, error);
            content = `Error loading content from ${article.content_file}`;
          }

          return {
            id: article.id,
            created_date: article.created_date,
            modified_date: article.modified_date,
            title: article.title,
            content: content,
            category: article.category,
          };
        });

        resolve(articles);
      } catch (error) {
        console.error('Error loading Maple KB articles:', error);
        resolve([]);
      }
    });
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
}
