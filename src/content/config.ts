import { defineCollection, z } from 'astro:content';

const terms = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    aliases: z.array(z.string()).default([]),
    custdev_phase: z.enum(['discovery', 'validation', 'creation', 'building']),
    owner: z.string(),
    created: z.coerce.date(),
    status: z.enum(['proposed', 'draft', 'in-review', 'published', 'deprecated', 'archived']),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const definitions = defineCollection({
  type: 'content',
  schema: z.object({
    term: z.string(),
    product: z.string().default('global'),
    custdev_phase: z.enum(['discovery', 'validation', 'creation', 'building']),
    confidence: z.enum(['hypothesis', 'tested', 'proven', 'canonical']),
    version: z.string(),
    owner: z.string(),
    method: z.string(),
    status: z.enum(['draft', 'in-review', 'published', 'deprecated', 'archived']),
    override_reason: z.string().optional(),
    last_validated: z.coerce.date().optional(),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const methods = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    method_type: z.enum([
      'customer-interview',
      'ab-test',
      'analytics',
      'industry-standard',
      'expert-opinion',
      'leadership-decision',
    ]),
    evidence_links: z.array(z.string()).default([]),
    confidence_level: z.enum(['low', 'medium', 'high']),
    date_validated: z.coerce.date().optional(),
    validator: z.string().optional(),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const versions = defineCollection({
  type: 'content',
  schema: z.object({
    term: z.string(),
    version: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    change_summary: z.string(),
    custdev_trigger: z.string(),
    diff_reference: z.string().optional(),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const products = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    team_members: z.array(z.string()).default([]),
    parent_product: z.string().optional(),
    status: z.enum(['active', 'sunset', 'planned']),
    custdev_phase: z.enum(['discovery', 'validation', 'creation', 'building']),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const frameworks = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const people = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    github: z.string().optional(),
    role: z.string(),
    title: z.string().optional(),
    timezone: z.string().optional(),
    expertise: z.array(z.string()).default([]),
    repos: z.array(z.string()).default([]),
    disc_profile: z.string().optional(),
    mbti: z.string().optional(),
    company: z.string().optional(),
    department: z.string().optional(),
    reports_to: z.string().optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    location: z.string().optional(),
    linkedin: z.string().optional(),
    previous_roles: z.array(z.object({
      title: z.string(),
      company: z.string().optional(),
      start_date: z.coerce.date().optional(),
      end_date: z.coerce.date().optional(),
      summary: z.string().optional(),
    })).default([]),
    education: z.array(z.object({
      institution: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      start_date: z.coerce.date().optional(),
      end_date: z.coerce.date().optional(),
      notes: z.string().optional(),
    })).default([]),
    status: z.enum(['active', 'alumni', 'contractor']).default('active'),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const entities = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    legal_name: z.string().optional(),
    parent: z.string().optional(),
    jurisdiction: z.string().optional(),
    entity_type: z.enum([
      'corporation',
      'llc',
      'gmbh',
      'limited',
      'partnership',
      'nonprofit',
      'other',
    ]).optional(),
    relationship: z.enum([
      'subsidiary',
      'investment',
      'partner',
      'affiliate',
      'joint-venture',
      'division',
      'holding',
      'other',
    ]).optional(),
    status: z.enum([
      'active',
      'inactive',
      'dissolved',
      'acquired',
      'planned',
      'divested',
    ]).default('active'),
    founded: z.coerce.date().optional(),
    dissolved: z.coerce.date().optional(),
    website: z.string().optional(),
    description: z.string().optional(),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const processes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum(['deployment', 'onboarding', 'review', 'incident', 'operations']),
    owner: z.string().optional(),
    tools: z.array(z.string()).default([]),
    status: z.enum(['draft', 'published', 'deprecated']).default('draft'),
    last_updated: z.coerce.date().optional(),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const resources = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    category: z.enum(['tool', 'service', 'platform', 'library']),
    url: z.string().optional(),
    owner: z.string().optional(),
    used_by: z.array(z.string()).default([]),
    status: z.enum(['active', 'deprecated', 'evaluating']).default('active'),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const adrs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    number: z.number(),
    status: z.enum(['proposed', 'accepted', 'superseded', 'deprecated']),
    date: z.coerce.date(),
    deciders: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

const repositories = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    github_url: z.string(),
    language: z.string(),
    description: z.string(),
    contributors: z.array(z.string()).default([]),
    tech_stack: z.array(z.string()).default([]),
    status: z.enum(['active', 'archived', 'experimental']).default('active'),
    reviewed_at: z.coerce.date().optional(),
    reviewed_by: z.string().optional(),
  }),
});

export const collections = {
  terms,
  definitions,
  methods,
  versions,
  products,
  frameworks,
  people,
  entities,
  processes,
  resources,
  adrs,
  repositories,
};
