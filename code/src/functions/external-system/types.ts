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

export interface ExternalPart {
  id: string;
  title: string;
  type: string;
  parent: string | null;
  description: string;
  owner_id?: string;
  created_date: string;
  modified_date: string;
}

export interface ExternalTicket {
  id: string;
  created_date: string;
  modified_date: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  account_id?: string;
  owner_id?: string;
  contact_id?: string;
  group_id?: string | null;
}

export interface ExternalIssue {
  id: string;
  created_date: string;
  modified_date: string;
  subject: string;
  description: string;
  status: string;
  impact: string;
  owner_id?: string;
  related_issue_ids?: string[];
}

export interface ExternalComment {
  id: string;
  created_date: string;
  modified_date: string;
  body: string;
  parent_id: string;
  created_by_id?: string;
  visibility?: string;
}

export interface ExternalUser {
  email: string;
  full_name: string;
  state?: string;
  phone_numbers?: string[];
}