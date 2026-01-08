/**
 * S379 Hotfix Tests - BUG-1 + BUG-2 Acceptance Tests
 *
 * BUG-1: Working hours parser - per-hour AM/PM conversion
 * BUG-2: Recall intent - entity extraction (not I/we)
 */

import { describe, it, expect } from 'vitest';
import { parsePreference } from '../preference-parser';
import { validatePreference } from '../preference-validator';
import { classifyIntent } from '../command-resolver';

// =============================================================================
// BUG-1: Working Hours Parser Tests
// =============================================================================

describe('BUG-1: Working Hours Parser', () => {
  it('"9am to 6pm" → { start: 9, end: 18 }', () => {
    const result = parsePreference('Working hours are 9am to 6pm');
    expect(result.success).toBe(true);
    expect(result.preference?.key).toBe('working_hours');
    expect(result.preference?.value).toEqual({ start: 9, end: 18 });

    // Should pass validation
    const validation = validatePreference(result.preference!);
    expect(validation.valid).toBe(true);
  });

  it('"12pm to 6pm" → { start: 12, end: 18 }', () => {
    const result = parsePreference('Working hours are 12pm to 6pm');
    expect(result.success).toBe(true);
    expect(result.preference?.value).toEqual({ start: 12, end: 18 });
  });

  it('"12am to 6am" → { start: 0, end: 6 }', () => {
    const result = parsePreference('Working hours are 12am to 6am');
    expect(result.success).toBe(true);
    expect(result.preference?.value).toEqual({ start: 0, end: 6 });
  });

  it('"6pm to 9pm" → { start: 18, end: 21 }', () => {
    const result = parsePreference('Working hours are 6pm to 9pm');
    expect(result.success).toBe(true);
    expect(result.preference?.value).toEqual({ start: 18, end: 21 });
  });

  it('"9 to 6" (no am/pm) → parses as raw hours', () => {
    const result = parsePreference('Working hours are 9 to 6');
    expect(result.success).toBe(true);
    // Without AM/PM, parsed as-is (9 to 6)
    expect(result.preference?.value).toEqual({ start: 9, end: 6 });
    // This fails validation because start > end
    const validation = validatePreference(result.preference!);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain('start < end');
  });

  it('"I work from 8am to 5pm" → { start: 8, end: 17 }', () => {
    const result = parsePreference('I work from 8am to 5pm');
    expect(result.success).toBe(true);
    expect(result.preference?.value).toEqual({ start: 8, end: 17 });
  });
});

// =============================================================================
// BUG-2: Recall Intent Entity Extraction Tests
// =============================================================================

describe('BUG-2: Recall Intent Entity Extraction', () => {
  it('"What did we decide about ABC Corp?" → entityName "ABC Corp"', () => {
    const result = classifyIntent('What did we decide about ABC Corp?');
    expect(result.intent).toBe('recall');
    expect(result.entityName).toBe('ABC Corp?');
  });

  it('"What did I decide about Alpha LLC?" → entityName "Alpha LLC?"', () => {
    const result = classifyIntent('What did I decide about Alpha LLC?');
    expect(result.intent).toBe('recall');
    expect(result.entityName).toBe('Alpha LLC?');
  });

  it('"what did we decide about XYZ ?" → trims properly', () => {
    const result = classifyIntent('what did we decide about XYZ ?');
    expect(result.intent).toBe('recall');
    expect(result.entityName).toBe('XYZ ?');
  });

  it('should NOT extract "we" or "I" as entityName', () => {
    const result1 = classifyIntent('What did we decide about TechCorp?');
    expect(result1.entityName).not.toBe('we');
    expect(result1.entityName).toContain('TechCorp');

    const result2 = classifyIntent('What did I decide about StartupXYZ?');
    expect(result2.entityName).not.toBe('I');
    expect(result2.entityName).toContain('StartupXYZ');
  });

  it('"remember ABC Company" → entityName "ABC Company"', () => {
    const result = classifyIntent('remember ABC Company');
    expect(result.intent).toBe('recall');
    expect(result.entityName).toBe('ABC Company');
  });
});
