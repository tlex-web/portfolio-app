import { MARKER_NAMES, markerForGrade } from '@/lib/trail-grade';

/**
 * The SAC waymark badge for a trail's real grade (D-06, D-24 vocabulary;
 * 11-UI-SPEC "TrailGradeMark"). A Server Component with zero JS.
 *
 * The 16 x 12 px glyph is decorative (`aria-hidden`) and is always followed by
 * the visible grade in Mono and an sr-only waymark name, so a screen reader
 * hears "T4, white-blue-white waymark". T2-T3 and T4-T5 differ by hue only,
 * which is why the grade text is never optional [UUPM `color-not-only`].
 *
 * - `yellow` (T1): a 12 x 12 px Swiss hiking-trail rhombus in `bg-trail`,
 *   centred in the 16 px box by its 2 px side margins.
 * - `white-red-white` (T2-T3) / `white-blue-white` (T4-T5): three stacked
 *   4 px bars in the background-only trail paint.
 * - `unmarked` (T6): a dashed box with no fill, the 08 "not exact" convention.
 *
 * Throws a RangeError for a grade outside T1 to T6 (through markerForGrade).
 * Class names stay literal so Tailwind's scanner sees every paint utility.
 */
export default function TrailGradeMark({ grade }: { grade: string }) {
  const marker = markerForGrade(grade);

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {marker === 'yellow' && (
        <span
          aria-hidden="true"
          data-marker={marker}
          className="mx-0.5 inline-block size-3 shrink-0 bg-trail [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]"
        />
      )}
      {marker === 'white-red-white' && (
        <span
          aria-hidden="true"
          data-marker={marker}
          className="inline-flex h-3 w-4 shrink-0 flex-col"
        >
          <span className="h-1 w-full bg-trail-blaze" />
          <span className="h-1 w-full bg-trail-mountain" />
          <span className="h-1 w-full bg-trail-blaze" />
        </span>
      )}
      {marker === 'white-blue-white' && (
        <span
          aria-hidden="true"
          data-marker={marker}
          className="inline-flex h-3 w-4 shrink-0 flex-col"
        >
          <span className="h-1 w-full bg-trail-blaze" />
          <span className="h-1 w-full bg-trail-alpine" />
          <span className="h-1 w-full bg-trail-blaze" />
        </span>
      )}
      {marker === 'unmarked' && (
        <span
          aria-hidden="true"
          data-marker={marker}
          className="inline-block h-3 w-4 shrink-0 border border-dashed border-ink-muted"
        />
      )}
      <span className="font-mono text-sm text-ink">{grade}</span>
      <span className="sr-only">, {MARKER_NAMES[marker]}</span>
    </span>
  );
}
