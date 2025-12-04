#!/usr/bin/env python3
"""
Discovery Engine Stress Test Report
Formats the enrichment API output for analysis
"""

import json
import sys

data = json.load(sys.stdin)
if not data.get('success'):
    print('ERROR:', data.get('error', 'Unknown error'))
    sys.exit(1)

result = data['data']
entities = result.get('entities', [])
quality = result.get('dataQuality', {})

print('=' * 80)
print('DISCOVERY ENGINE STRESS TEST - Employee Banking UAE')
print('=' * 80)
print()
sources = ', '.join(quality.get('sourcesUsed', []))
print(f'Sources Used: {sources}')
print(f'Total Companies Discovered: {len(entities)}')
print(f'Total Signals Detected: {quality.get("signalCount", 0)}')
print()
print('=' * 80)
print('DISCOVERED COMPANIES & SIGNALS')
print('=' * 80)

for i, entity in enumerate(entities, 1):
    print()
    print(f'#{i} {entity["name"]}')
    print('-' * 60)
    print(f'   Industry: {entity.get("industry", "N/A")}')
    headcount = entity.get("headcount", 0)
    print(f'   Headcount: {headcount:,} employees')
    print(f'   Size: {entity.get("size", "N/A")}')
    print(f'   City: {entity.get("city", "N/A")}')
    print(f'   Score: {entity.get("score", 0)}/100')
    print()

    # Score breakdown
    breakdown = entity.get('scoreBreakdown', {})
    if breakdown:
        print('   Score Breakdown:')
        for factor, score in breakdown.items():
            print(f'      - {factor}: {score}')

    # Signals
    signals = entity.get('signals', [])
    if signals:
        print()
        print(f'   Discovery Signals ({len(signals)} detected):')
        for j, sig in enumerate(signals[:5], 1):  # Top 5 signals
            conf = sig.get("confidence", 0) * 100
            print(f'   [{j}] {sig["type"]} (confidence: {conf:.0f}%)')
            desc = sig.get("description", "")
            if len(desc) > 100:
                desc = desc[:100] + "..."
            print(f'       {desc}')
            print(f'       Source: {sig.get("source", "N/A")}')
        if len(signals) > 5:
            print(f'   ... and {len(signals) - 5} more signals')

    # How it helps
    print()
    print('   WHY THIS MATTERS FOR EMPLOYEE BANKING:')
    if headcount >= 1000:
        print('   * Large employer = high payroll volume opportunity')
    if any(s['type'] == 'hiring-expansion' for s in signals):
        hiring_count = sum(1 for s in signals if s['type'] == 'hiring-expansion')
        print(f'   * {hiring_count} hiring signals = growing workforce needs payroll accounts')
    if any(s['type'] == 'office-opening' for s in signals):
        print('   * New office = new employee banking relationships')
    if any(s['type'] == 'funding-round' for s in signals):
        print('   * Recent funding = cash flow needs, banking relationship opportunity')
    if any(s['type'] == 'market-entry' for s in signals):
        print('   * Market entry = needs local banking partner')
    if any(s['type'] == 'subsidiary-creation' for s in signals):
        print('   * New subsidiary = separate payroll/banking needs')

print()
print('=' * 80)
print('SUMMARY')
print('=' * 80)
signal_types = {}
for entity in entities:
    for sig in entity.get('signals', []):
        sig_type = sig['type']
        signal_types[sig_type] = signal_types.get(sig_type, 0) + 1

print()
print('Signal Type Distribution:')
for sig_type, count in sorted(signal_types.items(), key=lambda x: -x[1]):
    print(f'   {sig_type}: {count} signals')

print()
print('Top Companies by Score:')
sorted_entities = sorted(entities, key=lambda x: x.get('score', 0), reverse=True)
for i, e in enumerate(sorted_entities[:5], 1):
    print(f'   {i}. {e["name"]} - Score: {e.get("score", 0)}, Signals: {len(e.get("signals", []))}')
