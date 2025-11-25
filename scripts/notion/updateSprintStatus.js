/**
 * Update Sprint Status in Notion
 */
import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function updateSprintStatus(sprintNumbers, status) {
  console.log(`Updating Sprints ${sprintNumbers.join(', ')} to "${status}"...\n`);

  for (const num of sprintNumbers) {
    const sprintName = `Sprint ${num}:`;

    // Find sprint
    const response = await notion.databases.query({
      database_id: dbIds.sprints_db_id,
      filter: {
        property: 'Sprint',
        title: { starts_with: sprintName }
      }
    });

    if (response.results.length > 0) {
      const sprint = response.results[0];
      await notion.pages.update({
        page_id: sprint.id,
        properties: {
          'Status': { select: { name: status } },
          'Started At': { date: { start: new Date().toISOString().split('T')[0] } },
        }
      });
      console.log(`✓ Sprint ${num} → ${status}`);
    } else {
      console.log(`✗ Sprint ${num} not found`);
    }
  }
}

// Get args
const args = process.argv.slice(2);
const sprints = args[0] ? args[0].split(',').map(Number) : [1, 2, 3, 4];
const status = args[1] || 'In Progress';

updateSprintStatus(sprints, status).catch(console.error);
