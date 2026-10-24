/**
 * Legacy highlights adapter (DATA-07, RESEARCH Pitfall 13). Temporary: Phase 11
 * renders the typed blocks directly and deletes this file.
 *
 * `ProjectHighlights` renders `Object.entries` of a v1 record and derives every
 * label from its keys, so the record it receives must match today's literal
 * exactly, key order included. data/__tests__/projects.test.ts pins the output
 * to a fixture captured from HEAD.
 */
import type { HighlightBlock } from '@/data/schemas/project';
import type { HighlightValue } from '@/data/types';

type Legacy = Record<string, HighlightValue>;

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Maps one typed block to the v1 highlight value stored under its key. */
function legacyValue(block: HighlightBlock): HighlightValue {
  switch (block.kind) {
    case 'metrics': {
      const out: Legacy = {};
      for (const m of block.metrics) out[m.key] = m.value;
      return out;
    }
    case 'risk-scale': {
      const out: Legacy = {
        rules: block.rules,
        riskLevels: block.bands.map(
          (b) => `${capitalise(b.level)} (${b.min.toFixed(1)}-${b.max.toFixed(1)})`,
        ),
      };
      for (const f of block.flags) out[f.key] = f.value;
      return out;
    }
    case 'pricing': {
      const out: Legacy = {};
      for (const t of block.tiers) {
        out[t.key] = { price: t.price, commands: t.commands, models: t.models, features: t.features };
      }
      return out;
    }
    case 'list':
      return block.items;
    case 'stack': {
      const out: Legacy = {};
      for (const g of block.groups) out[g.key] = g.items;
      return out;
    }
    default: {
      const unreachable: never = block;
      throw new Error(`unknown highlight block ${JSON.stringify(unreachable)}`);
    }
  }
}

/** Typed highlight blocks -> the v1 `Record<string, HighlightValue>`, in tuple order. */
export function toLegacyHighlights(blocks: readonly HighlightBlock[]): Legacy {
  const out: Legacy = {};
  for (const block of blocks) out[block.key] = legacyValue(block);
  return out;
}
