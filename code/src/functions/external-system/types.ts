// Custom system data types based on the structures returned by HttpClient

export interface ExternalCustomer {
  id: string;
  created_date: string;
  modified_date: string;
  name: string;
  email: string;
  company?: string;
}

export interface MapleKBArticleMetadata {
  id: string;
  created_date: string;
  modified_date: string;
  title: string;
  content_file: string;
  category?: string;
}

export interface ExternalMapleKB {
  id: string;
  created_date: string;
  modified_date: string;
  title: string;
  content: string;
  category?: string;
}