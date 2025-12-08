import { NextResponse } from 'next/server';

// Notion database IDs
const SPRINTS_DB_ID = '5c32e26d-641a-4711-a9fb-619703943fb9';

// Phase definitions with sprint ranges
const PHASES = [
  { phase: 1, name: 'Launch Ready', startSprint: 133, endSprint: 152, targetARR: '$100K' },
  { phase: 2, name: 'Intelligence Engine', startSprint: 153, endSprint: 167, targetARR: '$500K' },
  { phase: 3, name: 'Enterprise Ready', startSprint: 168, endSprint: 182, targetARR: '$3M' },
  { phase: 4, name: 'Scale & Expand', startSprint: 183, endSprint: 202, targetARR: '$20M' },
  { phase: 5, name: 'Dominance', startSprint: 203, endSprint: 217, targetARR: '$100M+' },
];

export type SprintStatus = 'Backlog' | 'In Progress' | 'Done' | 'Blocked';

export interface SprintData {
  id: string;
  sprintNumber: number;
  title: string;
  status: SprintStatus;
  repo: string;
  phase: number;
}

export interface PhaseProgress {
  phase: number;
  name: string;
  targetARR: string;
  totalSprints: number;
  completedSprints: number;
  inProgressSprints: number;
  percentComplete: number;
  sprints: SprintData[];
}

export interface ProgressResponse {
  success: boolean;
  data?: {
    totalSprints: number;
    completedSprints: number;
    inProgressSprints: number;
    overallPercent: number;
    phases: PhaseProgress[];
    currentPhase: number;
    currentSprint: SprintData | null;
    lastUpdated: string;
  };
  error?: string;
}

async function fetchAllSprints(notionToken: string): Promise<SprintData[]> {
  const sprints: SprintData[] = [];
  let hasMore = true;
  let startCursor: string | undefined = undefined;

  while (hasMore) {
    const body: Record<string, unknown> = {
      page_size: 100,
      sorts: [
        {
          property: 'Sprint',
          direction: 'ascending',
        },
      ],
    };

    if (startCursor) {
      body.start_cursor = startCursor;
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${SPRINTS_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    for (const page of data.results) {
      const props = page.properties;

      // Extract sprint title (e.g., "S133: Stealth Mode Polish")
      const titleProp = props.Sprint?.title?.[0]?.text?.content || '';
      const sprintMatch = titleProp.match(/S(\d+)/);
      const sprintNumber = sprintMatch ? parseInt(sprintMatch[1]) : 0;

      // Determine phase based on sprint number
      const phase = PHASES.find(
        (p) => sprintNumber >= p.startSprint && sprintNumber <= p.endSprint
      );

      sprints.push({
        id: page.id,
        sprintNumber,
        title: titleProp,
        status: (props.Status?.select?.name as SprintStatus) || 'Backlog',
        repo: props.Repo?.select?.name || 'Unknown',
        phase: phase?.phase || 0,
      });
    }

    hasMore = data.has_more;
    startCursor = data.next_cursor;
  }

  return sprints;
}

export async function GET(): Promise<NextResponse<ProgressResponse>> {
  try {
    // Get Notion token from environment
    const notionToken = process.env.NOTION_TOKEN_SAAS;

    if (!notionToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notion token not configured',
        },
        { status: 503 }
      );
    }

    // Fetch all sprints from Notion
    const sprints = await fetchAllSprints(notionToken);

    // Calculate phase-level progress
    const phases: PhaseProgress[] = PHASES.map((phaseInfo) => {
      const phaseSprints = sprints.filter((s) => s.phase === phaseInfo.phase);
      const completed = phaseSprints.filter((s) => s.status === 'Done').length;
      const inProgress = phaseSprints.filter((s) => s.status === 'In Progress').length;

      return {
        phase: phaseInfo.phase,
        name: phaseInfo.name,
        targetARR: phaseInfo.targetARR,
        totalSprints: phaseSprints.length,
        completedSprints: completed,
        inProgressSprints: inProgress,
        percentComplete: phaseSprints.length > 0
          ? Math.round((completed / phaseSprints.length) * 100)
          : 0,
        sprints: phaseSprints.sort((a, b) => a.sprintNumber - b.sprintNumber),
      };
    });

    // Calculate overall progress
    const totalSprints = sprints.length;
    const completedSprints = sprints.filter((s) => s.status === 'Done').length;
    const inProgressSprints = sprints.filter((s) => s.status === 'In Progress').length;
    const overallPercent = totalSprints > 0
      ? Math.round((completedSprints / totalSprints) * 100)
      : 0;

    // Determine current phase (first phase with incomplete sprints)
    const currentPhase = phases.find((p) => p.percentComplete < 100)?.phase || 5;

    // Get current sprint (first "In Progress" or first "Backlog" in current phase)
    const currentPhaseSprints = sprints.filter((s) => s.phase === currentPhase);
    const currentSprint =
      currentPhaseSprints.find((s) => s.status === 'In Progress') ||
      currentPhaseSprints.find((s) => s.status === 'Backlog') ||
      null;

    return NextResponse.json({
      success: true,
      data: {
        totalSprints,
        completedSprints,
        inProgressSprints,
        overallPercent,
        phases,
        currentPhase,
        currentSprint,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sprint progress API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sprint progress',
      },
      { status: 500 }
    );
  }
}
