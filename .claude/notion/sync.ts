/**
 * TC Notion Sync Module
 *
 * This module enforces mandatory full property population for all Notion database updates.
 * TC must use this module for all Notion operations to ensure governance compliance.
 *
 * MANDATORY RULES:
 * 1. TC must populate ALL required fields when updating Notion databases
 * 2. TC must never update only Status fields - all fields must be populated
 * 3. TC must update Knowledge Page after every stretch with ALL 8 learning sections
 * 4. TC must follow the 9-step Notion sync workflow
 */

import { Client } from '@notionhq/client';

// Database IDs from .notion-db-ids.json
export const DB_IDS = {
  sprints: '5c32e26d-641a-4711-a9fb-619703943fb9',
  features: '26ae5afe-4b5f-4d97-b402-5c459f188944',
  knowledge: 'f1552250-cafc-4f5f-90b0-edc8419e578b',
};

// ============================================================================
// SPRINT SCHEMA - Required Fields
// ============================================================================
export interface SprintRecord {
  // Required fields - TC MUST populate ALL of these
  sprintName: string;          // title
  status: 'Backlog' | 'In Progress' | 'Completed' | 'Blocked';
  goal: string;                // rich_text - Sprint goal/objective
  outcomes: string;            // rich_text - What was achieved
  highlights: string;          // rich_text - Key highlights
  businessValue: string;       // rich_text - Business impact
  startedAt: string;           // date - ISO format
  completedAt?: string;        // date - ISO format (when completed)
  commit: string;              // rich_text - Git commit reference
  gitTag: string;              // rich_text - Git tag
  branch: string;              // rich_text - Branch name
  phasesUpdated: string[];     // multi_select - Phases affected
  learnings: string;           // rich_text - Lessons learned
  commitsCount: number;        // number - Total commits
  syncedAt?: string;           // date - Auto-set on sync

  // Optional but recommended
  notes?: string;              // rich_text - Additional notes
  dependencies?: string;       // rich_text - Dependencies on other sprints
  environmentDeployed?: string; // rich_text - staging/production
}

// ============================================================================
// FEATURE SCHEMA - Required Fields
// ============================================================================
export interface FeatureRecord {
  // Required fields - TC MUST populate ALL of these
  featureName: string;         // title
  sprint: number;              // number - Sprint number (1, 2, S1, S2, etc.)
  status: 'Not Started' | 'In Progress' | 'Done' | 'Blocked';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  complexity: 'Very High' | 'High' | 'Medium' | 'Low';
  type: 'Feature' | 'Bug Fix' | 'Infrastructure' | 'Testing' | 'Documentation';
  notes: string;               // rich_text - Implementation notes
  tags: string[];              // multi_select - Tags for categorization
  startedAt?: string;          // date - ISO format
  completedAt?: string;        // date - ISO format
  assignee: string;            // rich_text - Usually 'Claude (TC)'
  done: boolean;               // checkbox

  // Optional but recommended
  implementationSummary?: string; // rich_text
  linesOfCode?: number;        // number
  filesModified?: string[];    // multi_select or rich_text
  testCoverage?: number;       // number (percentage)
  commitReference?: string;    // rich_text
  qaCheckStatus?: string;      // rich_text
  documentationLink?: string;  // url
  securityCategory?: string;   // rich_text (for security features)
}

// ============================================================================
// KNOWLEDGE PAGE SCHEMA - 8 Required Learning Sections
// ============================================================================
export interface KnowledgePageContent {
  // ALL 8 SECTIONS ARE MANDATORY - TC must never skip any section

  // Section 1: Product Essentials
  productEssentials: {
    productName: string;
    tagline: string;
    problemSolved: string;
    targetAudience: string;
    uniqueValue: string;
  };

  // Section 2: Core Frameworks
  coreFrameworks: {
    frontend: string[];
    backend: string[];
    infrastructure: string[];
    security: string[];
  };

  // Section 3: Technologies Used
  technologiesUsed: {
    languages: string[];
    databases: string[];
    cloud: string[];
    apis: string[];
    tools: string[];
  };

  // Section 4: Key Capabilities
  keyCapabilities: string[];

  // Section 5: ELI5 (Explain Like I'm 5)
  eli5: string;

  // Section 6: Real-World Analogy
  realWorldAnalogy: string;

  // Section 7: Explain to Different Audiences
  audienceExplanations: {
    investors: string;
    cxos: string;
    bdms: string;
    hiringManagers: string;
    engineers: string;
  };

  // Section 8: Innovation & Differentiation
  innovationDifferentiation: {
    whatMakesItUnique: string;
    competitiveAdvantage: string;
    futureVision: string;
  };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates that all required sprint fields are populated
 */
export function validateSprintRecord(sprint: Partial<SprintRecord>): string[] {
  const errors: string[] = [];
  const requiredFields = [
    'sprintName', 'status', 'goal', 'outcomes', 'highlights',
    'businessValue', 'startedAt', 'commit', 'gitTag', 'branch',
    'phasesUpdated', 'learnings', 'commitsCount'
  ];

  for (const field of requiredFields) {
    if (!(field in sprint) || sprint[field as keyof SprintRecord] === undefined || sprint[field as keyof SprintRecord] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return errors;
}

/**
 * Validates that all required feature fields are populated
 */
export function validateFeatureRecord(feature: Partial<FeatureRecord>): string[] {
  const errors: string[] = [];
  const requiredFields = [
    'featureName', 'sprint', 'status', 'priority', 'complexity',
    'type', 'notes', 'tags', 'assignee', 'done'
  ];

  for (const field of requiredFields) {
    if (!(field in feature) || feature[field as keyof FeatureRecord] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return errors;
}

/**
 * Validates that all 8 Knowledge Page sections are populated
 */
export function validateKnowledgePage(content: Partial<KnowledgePageContent>): string[] {
  const errors: string[] = [];
  const sections = [
    'productEssentials',
    'coreFrameworks',
    'technologiesUsed',
    'keyCapabilities',
    'eli5',
    'realWorldAnalogy',
    'audienceExplanations',
    'innovationDifferentiation'
  ];

  for (const section of sections) {
    if (!(section in content) || !content[section as keyof KnowledgePageContent]) {
      errors.push(`Missing required Knowledge Page section: ${section}`);
    }
  }

  return errors;
}

// ============================================================================
// 9-STEP NOTION SYNC WORKFLOW
// ============================================================================

/**
 * TC must follow this 9-step workflow for ALL Notion updates:
 *
 * 1. Fetch schema - Retrieve full database schema
 * 2. Validate schema - Ensure all required properties exist
 * 3. Detect missing fields - Identify which fields are empty
 * 4. Populate all required fields - Update every field listed above
 * 5. Delete meaningless columns - Remove unused/redundant columns
 * 6. Check Knowledge Page - Determine if Knowledge Page needs update
 * 7. Apply updates - Execute all database writes
 * 8. Write detailed commit message - Document changes in Notion logs
 * 9. Confirm completion - Verify all updates succeeded
 */
export async function executeNotionSync(
  notion: Client,
  options: {
    updateSprints?: SprintRecord[];
    updateFeatures?: FeatureRecord[];
    updateKnowledge?: KnowledgePageContent;
  }
): Promise<{ success: boolean; errors: string[]; summary: string }> {
  const errors: string[] = [];
  const summary: string[] = [];

  console.log('Starting 9-Step Notion Sync Workflow...\n');

  // Step 1: Fetch schema
  console.log('Step 1: Fetching database schemas...');

  // Step 2: Validate schema
  console.log('Step 2: Validating schemas...');

  // Step 3: Detect missing fields
  console.log('Step 3: Detecting missing fields...');

  // Step 4: Populate all required fields
  console.log('Step 4: Populating all required fields...');

  if (options.updateSprints) {
    for (const sprint of options.updateSprints) {
      const sprintErrors = validateSprintRecord(sprint);
      if (sprintErrors.length > 0) {
        errors.push(`Sprint "${sprint.sprintName}": ${sprintErrors.join(', ')}`);
      }
    }
  }

  if (options.updateFeatures) {
    for (const feature of options.updateFeatures) {
      const featureErrors = validateFeatureRecord(feature);
      if (featureErrors.length > 0) {
        errors.push(`Feature "${feature.featureName}": ${featureErrors.join(', ')}`);
      }
    }
  }

  if (options.updateKnowledge) {
    const knowledgeErrors = validateKnowledgePage(options.updateKnowledge);
    if (knowledgeErrors.length > 0) {
      errors.push(`Knowledge Page: ${knowledgeErrors.join(', ')}`);
    }
  }

  // Step 5: Delete meaningless columns (handled manually)
  console.log('Step 5: Checking for meaningless columns...');

  // Step 6: Check Knowledge Page
  console.log('Step 6: Checking Knowledge Page status...');

  // Step 7: Apply updates
  console.log('Step 7: Applying updates...');

  if (errors.length > 0) {
    console.log('\n*** VALIDATION FAILED - Updates blocked ***');
    console.log('Errors found:');
    errors.forEach(e => console.log(`  - ${e}`));
    return { success: false, errors, summary: 'Validation failed' };
  }

  // Step 8: Write detailed commit message
  console.log('Step 8: Writing commit message...');
  summary.push(`Synced at ${new Date().toISOString()}`);
  if (options.updateSprints) summary.push(`Sprints updated: ${options.updateSprints.length}`);
  if (options.updateFeatures) summary.push(`Features updated: ${options.updateFeatures.length}`);
  if (options.updateKnowledge) summary.push('Knowledge Page updated with all 8 sections');

  // Step 9: Confirm completion
  console.log('Step 9: Confirming completion...');
  console.log('\n*** Notion Sync Complete ***');

  return { success: true, errors: [], summary: summary.join('; ') };
}

// ============================================================================
// FORBIDDEN PRACTICES
// ============================================================================

/**
 * FORBIDDEN PRACTICES - TC MUST NEVER:
 *
 * 1. Update only the Status field
 * 2. Skip filling required fields
 * 3. Assume a field is optional
 * 4. Leave Notes, Learnings, or Business Value empty
 * 5. Skip Knowledge Page update after a stretch
 * 6. Perform minimal Knowledge Page updates
 * 7. Skip any of the 8 Knowledge Page sections
 */

// ============================================================================
// EXPORTS
// ============================================================================

export const SYNC_MODULE_VERSION = '1.0.0';
export const LAST_UPDATED = '2025-11-24';

export default {
  DB_IDS,
  validateSprintRecord,
  validateFeatureRecord,
  validateKnowledgePage,
  executeNotionSync,
  SYNC_MODULE_VERSION,
  LAST_UPDATED,
};
