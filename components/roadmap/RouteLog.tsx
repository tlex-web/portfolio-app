import RouteRow from './RouteRow';
import { countLabel } from '@/lib/home-format';
import { BAND_LABELS, STATUS_LABELS, type LogBand } from '@/lib/route-log';

/**
 * The route log as a climb (ROUTE-01; D-19; 11-UI-SPEC "RouteLog (Server) —
 * the elevation axis"). Server Component: no client directive, nothing
 * animates.
 *
 * bands() decides which bands render and in which order (Summit, Current
 * camp, Base, top to bottom; an empty band is left out) and sorts the rows by
 * order descending, so DOM order = visual order = tab order. The axis on the
 * left is decoration only (aria-hidden): a 1 px line from the first to the
 * last rendered band, a 12 px summit triangle at the top (Home's SummitMark
 * shape), a 16 px base tick at the bottom, and a 24 x 2 px accent camp marker
 * at the Current camp heading. It carries no altitude figures, completion
 * bars or priority. Current camp is the raised plate; emphasis is plate,
 * heading and marker, not colour alone.
 *
 * Geometry: the axis line sits 12 px into the 32 px column (`pl-8`). Each band
 * sets `--axis-x`, the distance from a row's left edge back to the axis, which
 * RouteRow uses to draw its tick: 20 px on the surface bands, 45 px inside the
 * camp plate (its 24 px `p-6` padding and 1 px border added). The camp marker
 * is a child of the camp heading (made `relative`), whose left edge is the
 * plate's content edge, so it needs no pixel literal (12-UI-SPEC D-24): it is
 * centred on the heading's line (`top-1/2 -translate-y-1/2`) and on the axis
 * (`left: calc(var(--axis-x) * -1)` with `-translate-x-1/2`).
 *
 * `bands` is the output of bands() (or routeLogView().bands) in lib/route-log.
 */
export default function RouteLog({ bands }: { bands: readonly LogBand[] }) {
  if (bands.length === 0) return null;

  return (
    <div className="relative pl-8 [--axis-x:20px]">
      <div data-route-axis aria-hidden="true">
        <span className="absolute top-0 left-3 size-3 -translate-x-1/2 bg-ink-muted [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
        <span className="absolute top-3 bottom-0 left-3 w-px bg-line-strong" />
        <span className="absolute bottom-0 left-1 h-px w-4 bg-line-strong" />
      </div>

      {bands.map((band, i) => {
        const camp = band.id === 'current-camp';
        const headingId = `${band.id}-heading`;
        return (
          <section
            key={band.id}
            id={band.id}
            aria-labelledby={headingId}
            className={[
              'relative',
              i > 0 ? 'mt-6' : '',
              i === 0 && !camp ? 'pt-4' : '',
              camp
                ? 'rounded-lg border border-line-strong bg-surface-raised p-6 [--axis-x:45px]'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <h2 id={headingId} className={camp ? 'relative text-heading' : 'text-heading'}>
              {BAND_LABELS[band.id]}
              {camp ? (
                <span
                  data-camp-marker
                  aria-hidden="true"
                  className="absolute top-1/2 left-[calc(var(--axis-x)*-1)] h-0.5 w-6 -translate-x-1/2 -translate-y-1/2 bg-accent"
                />
              ) : null}
            </h2>
            <p className="mt-1 font-mono text-sm text-ink-muted">
              {STATUS_LABELS[band.status]} · {countLabel(band.items.length, 'entry', 'entries')}
            </p>
            <ol className="mt-2">
              {band.items.map((item) => (
                <RouteRow key={item.id} item={item} variant="log" />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
