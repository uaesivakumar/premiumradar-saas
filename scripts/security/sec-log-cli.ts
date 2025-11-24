#!/usr/bin/env node
/**
 * Sprint S6: Security Log CLI Utility
 *
 * Usage:
 *   npm run sec:log -- --event "Vulnerability fixed" --severity high
 *   npm run sec:validate
 *   npm run sec:sprint-complete -- --sprint "Sprint S4" --features 4
 */

import {
  createSecurityLogEntry,
  appendSecurityLog,
  validateLogChain,
  createSignedSecurityCommit,
  bumpVersion,
  sendWebhookNotification,
  completeSecuritySprint,
} from './security-log';

const args = process.argv.slice(2);

function parseArgs(): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : 'true';
      parsed[key] = value;
      if (value !== 'true') i++;
    }
  }
  return parsed;
}

async function main() {
  const command = args[0];
  const options = parseArgs();

  switch (command) {
    case 'add':
      // Add security log entry
      if (!options.event || !options.severity) {
        console.error('Usage: sec-log-cli add --event "description" --severity [low|medium|high|critical]');
        process.exit(1);
      }

      const entry = createSecurityLogEntry({
        event_type: (options.type as any) || 'security_change',
        severity: options.severity as any,
        description: options.event,
        author: options.author || 'Claude (TC)',
        sprint: options.sprint,
        affected_files: options.files ? options.files.split(',') : [],
      });

      appendSecurityLog(entry);
      break;

    case 'validate':
      // Validate log chain
      const isValid = validateLogChain();
      process.exit(isValid ? 0 : 1);

    case 'commit':
      // Create signed commit
      if (!options.message) {
        console.error('Usage: sec-log-cli commit --message "commit message" --files "file1,file2"');
        process.exit(1);
      }

      const files = options.files ? options.files.split(',') : [];
      const result = createSignedSecurityCommit(options.message, files);
      process.exit(result.success ? 0 : 1);

    case 'version':
      // Bump version
      const type = (options.type as 'patch' | 'minor' | 'major') || 'patch';
      const versionResult = bumpVersion(type);
      process.exit(versionResult.success ? 0 : 1);

    case 'notify':
      // Send webhook notification
      if (!options.webhook || !options.message) {
        console.error('Usage: sec-log-cli notify --webhook "URL" --message "message" --severity [low|medium|high|critical]');
        process.exit(1);
      }

      const success = await sendWebhookNotification(options.webhook, {
        event: options.event || 'Security Event',
        severity: (options.severity as any) || 'medium',
        message: options.message,
        timestamp: new Date(),
      });

      process.exit(success ? 0 : 1);

    case 'sprint-complete':
      // Complete sprint workflow
      if (!options.sprint || !options.features) {
        console.error('Usage: sec-log-cli sprint-complete --sprint "Sprint S4" --features 4 --files "file1,file2"');
        process.exit(1);
      }

      await completeSecuritySprint({
        sprint: options.sprint,
        description: options.description || '',
        featuresCount: parseInt(options.features),
        files: options.files ? options.files.split(',') : [],
        metrics: [],
        webhookUrl: options.webhook,
      });
      break;

    default:
      console.log(`
Security Log CLI - Sprint S6

Commands:
  add              Add security log entry
  validate         Validate log chain integrity
  commit           Create signed security commit
  version          Bump version (patch/minor/major)
  notify           Send webhook notification
  sprint-complete  Complete sprint workflow

Examples:
  sec-log-cli add --event "Fixed XSS vulnerability" --severity critical
  sec-log-cli validate
  sec-log-cli commit --message "Security fix" --files "lib/security.ts"
  sec-log-cli version --type patch
  sec-log-cli notify --webhook "https://hooks.slack.com/..." --message "Sprint complete"
  sec-log-cli sprint-complete --sprint "Sprint S4" --features 4 --files "..."

Options:
  --event         Event description
  --severity      low | medium | high | critical
  --type          Event type or version type
  --author        Author name (default: Claude TC)
  --sprint        Sprint name
  --files         Comma-separated file list
  --message       Commit or notification message
  --webhook       Webhook URL
  --features      Number of features
  --description   Sprint description
`);
      break;
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
