import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const CONFIG_DIR = path.resolve(process.cwd(), 'config');

function loadYaml<T>(filename: string): T {
  const filepath = path.join(CONFIG_DIR, filename);
  const raw = fs.readFileSync(filepath, 'utf-8');
  return YAML.parse(raw) as T;
}

export interface SiteConfig {
  company: {
    name: string;
    logo: string;
    tagline: string;
  };
  wiki: {
    title: string;
    base_url: string;
    default_language: string;
    reading_level_target: number;
  };
  custdev: {
    phases: Array<{
      slug: string;
      label: string;
      color: string;
      icon: string;
      default_confidence: string;
    }>;
  };
  cms: {
    enabled: boolean;
    backend: string;
    editorial_workflow: boolean;
  };
}

export interface ProductConfig {
  products: Array<{
    slug: string;
    name: string;
    description: string;
    status: string;
    team: {
      lead: string;
      members: string[];
    };
    custdev_phase: string;
  }>;
}

export interface AuthConfig {
  auth: {
    provider: string;
    local: {
      users: Array<{
        username: string;
        password_hash: string;
        email: string;
        role: string;
      }>;
    };
    jwt: {
      secret_env_var: string;
      expires_in: string;
      cookie_name: string;
    };
    github?: {
      client_id: string;
      client_secret: string;
      allowed_orgs: string[];
    };
    gitlab?: {
      client_id: string;
      client_secret: string;
      allowed_groups: string[];
    };
  };
}

export interface TeamsConfig {
  roles: Array<{
    slug: string;
    permissions: string[];
    scope?: string;
  }>;
  people: Array<{
    name: string;
    email: string;
    role: string;
    products?: string[];
  }>;
}

export interface GovernanceConfig {
  review: {
    staleness_threshold_days: number;
    min_reviewers: number;
    require_external_reviewer: boolean;
  };
  quality: {
    min_terms_per_product: number;
    reading_level_target: number;
    reading_level_hard_limit: number;
    require_definition_method: boolean;
    require_custdev_phase: boolean;
  };
  alignment: {
    quarterly_review: boolean;
    divergence_report_schedule: string;
    dispute_resolution_days: number;
  };
  notifications: {
    channel: string;
    webhook_url: string;
    notify_on: string[];
  };
}

export function getSiteConfig(): SiteConfig {
  return loadYaml<SiteConfig>('site.yaml');
}

export function getProductsConfig(): ProductConfig {
  return loadYaml<ProductConfig>('products.yaml');
}

export function getAuthConfig(): AuthConfig {
  return loadYaml<AuthConfig>('auth.yaml');
}

export function getTeamsConfig(): TeamsConfig {
  return loadYaml<TeamsConfig>('teams.yaml');
}

export function getGovernanceConfig(): GovernanceConfig {
  return loadYaml<GovernanceConfig>('governance.yaml');
}
