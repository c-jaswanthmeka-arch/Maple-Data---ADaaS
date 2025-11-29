import AdmZip from 'adm-zip';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Extracts a ZIP file from a buffer to a temporary directory
 * @param zipBuffer Buffer containing the ZIP file data
 * @param extractToDir Directory to extract to (optional, defaults to temp dir)
 * @returns Path to the extracted directory
 */
export function extractZip(zipBuffer: Buffer, extractToDir?: string): string {
  const extractPath = extractToDir || join(tmpdir(), `maple-data-${Date.now()}`);
  
  // Create extraction directory if it doesn't exist
  if (!existsSync(extractPath)) {
    mkdirSync(extractPath, { recursive: true });
  }

  const zip = new AdmZip(zipBuffer);
  zip.extractAllTo(extractPath, true);
  
  return extractPath;
}

/**
 * Reads customers.json from the extracted ZIP directory
 * @param extractPath Path to the extracted ZIP directory
 * @returns Parsed customers data or null if file doesn't exist
 */
export function readCustomersFromZip(extractPath: string): any[] | null {
  const customersPath = join(extractPath, 'customers.json');
  
  if (!existsSync(customersPath)) {
    return null;
  }

  try {
    const content = readFileSync(customersPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading customers.json from ZIP:', error);
    return null;
  }
}

/**
 * Reads articles.json from the extracted ZIP directory
 * @param extractPath Path to the extracted ZIP directory
 * @returns Parsed articles metadata or null if file doesn't exist
 */
export function readArticlesMetadataFromZip(extractPath: string): any[] | null {
  const articlesPath = join(extractPath, 'maple_kb', 'articles.json');
  
  if (!existsSync(articlesPath)) {
    return null;
  }

  try {
    const content = readFileSync(articlesPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading articles.json from ZIP:', error);
    return null;
  }
}

/**
 * Reads a markdown file from the extracted ZIP directory
 * @param extractPath Path to the extracted ZIP directory
 * @param filename Name of the markdown file
 * @returns File content or empty string if file doesn't exist
 */
export function readMarkdownFromZip(extractPath: string, filename: string): string {
  const markdownPath = join(extractPath, 'maple_kb', filename);
  
  if (!existsSync(markdownPath)) {
    return '';
  }

  try {
    return readFileSync(markdownPath, 'utf-8');
  } catch (error) {
    console.error(`Error reading markdown file ${filename} from ZIP:`, error);
    return '';
  }
}

