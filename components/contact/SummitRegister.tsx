'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react/dist/ssr';
import {
  FEEDBACK_LIMITS,
  HONEYPOT_FIELD,
  type FeedbackField,
  type FeedbackResponse,
  type FieldIssue,
} from '@/lib/contact/api-contract';
import { site } from '@/data/site';
import { formatCount, formatEntryTime } from '@/lib/home-format';

/** No answer within this many milliseconds is a network failure (UI-SPEC "Send failed"). */
export const SEND_TIMEOUT_MS = 15_000;

/** The visible fields in form order (labels Name, Email, Message are locked). */
const FIELDS: readonly FeedbackField[] = ['name', 'email', 'message'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The approved inline message for one issue on one field (12-01
 * copy.field-errors, cause plus fix, D-6). `value` is the field as typed; its
 * length fills the message's "(now {n})".
 */
function issueMessage(field: FeedbackField, issue: FieldIssue, value: string): string {
  if (field === 'name') return 'Enter your name.';
  if (field === 'email') {
    return issue === 'required'
      ? 'Enter your email address.'
      : 'Enter a full email address, with an @ and a domain.';
  }
  if (issue === 'too_short') return `Write at least 10 characters (now ${value.length}).`;
  if (issue === 'too_long') {
    return `Shorten the message to 2,000 characters (now ${formatCount(value.length)}).`;
  }
  return 'Write a message.';
}

/**
 * Submit-time check of one field against FEEDBACK_LIMITS (CONTACT-02): the
 * approved message, or null when the value is valid. Lengths count the value
 * as typed, the way the route's zod schema counts it; a value of only spaces
 * counts as empty.
 */
export function validateField(field: FeedbackField, value: string): string | null {
  const blank = value.trim() === '';
  if (field === 'name') {
    if (blank) return issueMessage('name', 'required', value);
    return value.length > FEEDBACK_LIMITS.nameMax ? issueMessage('name', 'too_long', value) : null;
  }
  if (field === 'email') {
    if (blank) return issueMessage('email', 'required', value);
    return EMAIL_PATTERN.test(value.trim()) ? null : issueMessage('email', 'invalid_email', value);
  }
  if (blank) return issueMessage('message', 'required', value);
  if (value.length < FEEDBACK_LIMITS.messageMin) return issueMessage('message', 'too_short', value);
  if (value.length > FEEDBACK_LIMITS.messageMax) return issueMessage('message', 'too_long', value);
  return null;
}

/**
 * Whole minutes until another attempt from a `Retry-After` value in seconds:
 * ceil(seconds / 60), at least 1. Null when the value is missing or is not a
 * number of seconds (the copy then reads "Try again later").
 */
export function minutesFromRetryAfter(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const seconds = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return Math.max(1, Math.ceil(seconds / 60));
}

interface Values {
  name: string;
  email: string;
  message: string;
  interestedInCollaboration: boolean;
}

const EMPTY: Values = { name: '', email: '', message: '', interestedInCollaboration: false };

type Errors = Partial<Record<FeedbackField, string>>;

/** Why a send did not sign the register; each kind has its own approved copy. */
type Failure =
  | { kind: 'send' }
  | { kind: 'network' }
  | { kind: 'rate'; minutes: number | null }
  | { kind: 'origin' };

type Outcome =
  | { kind: 'ok' }
  | { kind: 'validation'; fields: FeedbackResponse['fields'] }
  | { kind: 'failed'; failure: Failure };

/** The 07 field (UI-SPEC "Inputs"); invalid swaps the border to danger. */
const fieldClass = (invalid: boolean) =>
  `w-full min-h-11 px-4 py-2 rounded-sm bg-surface-overlay text-ink border placeholder:text-ink-muted read-only:cursor-default ${
    invalid ? 'border-danger' : 'border-line-strong'
  }`;

const LABEL = 'mb-2 block text-sm font-semibold text-ink';

/** The 07 primary button; aria-disabled (never disabled) keeps focus on it while sending. */
const PRIMARY =
  'inline-flex min-h-11 items-center gap-2 self-start rounded-sm bg-accent px-6 text-base font-semibold text-ink-inverse cursor-pointer touch-manipulation transition-colors duration-(--duration-fast) ease-erosion hover:bg-accent-hover aria-disabled:cursor-progress aria-disabled:hover:bg-accent';

/** The 07 secondary button. */
const SECONDARY =
  'inline-flex min-h-11 items-center gap-2 rounded-sm border border-line-strong px-4 text-base font-semibold text-ink cursor-pointer touch-manipulation transition-colors duration-(--duration-fast) ease-erosion hover:bg-surface-overlay aria-disabled:cursor-progress aria-disabled:hover:bg-transparent';

/** The address with a break point after the "@"; the link text copies as the plain address. */
const [EMAIL_USER, EMAIL_DOMAIN] = site.email.split('@');

function EmailLink() {
  return (
    <a
      href={`mailto:${site.email}`}
      className="text-accent underline decoration-1 underline-offset-4 wrap-anywhere hover:text-accent-hover"
    >
      {`${EMAIL_USER}@`}
      <wbr />
      {EMAIL_DOMAIN}
    </a>
  );
}

/** Title and body per failure kind (12-01 copy.fail-send, fail-network, fail-429, fail-403). */
function FailureCopy({ failure }: { failure: Failure }) {
  switch (failure.kind) {
    case 'send':
      return (
        <>
          Your message is still here. Try again, or email me at <EmailLink />.
        </>
      );
    case 'network':
      return (
        <>
          Check your connection. Your message is still here. Try again, or email me at{' '}
          <EmailLink />.
        </>
      );
    case 'rate':
      return (
        <>
          This connection has sent too many entries in the last hour.{' '}
          {failure.minutes === null
            ? 'Try again later'
            : `Try again in ${failure.minutes} ${failure.minutes === 1 ? 'minute' : 'minutes'}`}
          , or email me at <EmailLink />.
        </>
      );
    case 'origin':
      return (
        <>
          Copy your message, reload the page and send it again, or email me at <EmailLink />.
        </>
      );
  }
}

const FAILURE_TITLE: Record<Failure['kind'], string> = {
  send: "Couldn't send.",
  network: "Couldn't reach the server.",
  rate: 'Too many attempts.',
  origin: "Couldn't verify this page.",
};

/** Maps one answer from /api/feedback to an outcome; anything unreadable is a network failure. */
function outcomeOf(response: Response, body: Partial<FeedbackResponse> | null): Outcome {
  switch (body?.code) {
    case 'ok':
      return { kind: 'ok' };
    case 'validation':
      return { kind: 'validation', fields: body.fields };
    case 'send-failed':
    case 'server-error':
      return { kind: 'failed', failure: { kind: 'send' } };
    case 'rate-limited':
      return {
        kind: 'failed',
        failure: {
          kind: 'rate',
          minutes: minutesFromRetryAfter(response.headers.get('Retry-After') ?? body.retryAfterS),
        },
      };
    case 'origin-rejected':
      return { kind: 'failed', failure: { kind: 'origin' } };
    default:
      return { kind: 'failed', failure: { kind: 'network' } };
  }
}

/**
 * The summit register: the Contact form island (CONTACT-01, CONTACT-02, the
 * client half of CONTACT-03; D-02, D-03; 12-UI-SPEC "/contact — Summit
 * Register", "Form card" and "Validation and submit states").
 *
 * Visible labels and borders on every field, submit-time validation with the
 * approved inline errors, and the `trail_note` honeypot outside the
 * accessibility tree and the Tab order. A valid submit posts JSON to
 * /api/feedback (no Server Action) and enters Sending: the button reads
 * `Sending…` with aria-disabled, the fields are read-only and repeat clicks
 * send nothing. No answer within 15 s aborts and counts as a network failure;
 * an answer arriving after that is ignored.
 *
 * Only `{ code: 'ok' }` signs the register (D-02): the entry replaces the form,
 * takes focus and echoes the visitor's own name and address through React
 * text nodes. Every other outcome keeps every field as typed and shows the
 * focused failure box, whose body always ends with a mailto: link; send and
 * network failures offer Retry. Nothing typed is ever logged (D-04).
 */
export default function SummitRegister() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [trailNote, setTrailNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<{ failure: Failure; seq: number } | null>(null);
  const [signed, setSigned] = useState<{ name: string; email: string; at: Date } | null>(null);

  /** Synchronous guard, so two clicks in one frame still send once. */
  const sendingRef = useRef(false);
  /** The live request; an answer for any other id is stale and ignored. */
  const requestRef = useRef(0);
  const failureRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Partial<Record<FeedbackField, HTMLInputElement | HTMLTextAreaElement>>>(
    {},
  );
  /** The field to focus after the next render (Sign again, an invalid submit). */
  const focusNext = useRef<FeedbackField | null>(null);

  useEffect(() => {
    if (failure) failureRef.current?.focus();
  }, [failure]);

  useEffect(() => {
    if (signed) entryRef.current?.focus();
  }, [signed]);

  useEffect(() => {
    if (focusNext.current) {
      fieldRefs.current[focusNext.current]?.focus();
      focusNext.current = null;
    }
  });

  // An unmounted island ignores any answer still in flight.
  useEffect(
    () => () => {
      requestRef.current += 1;
    },
    [],
  );

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function send(v: Values) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    const id = ++requestRef.current;
    const submittedAt = new Date();
    setSending(true);

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error('timeout'));
      }, SEND_TIMEOUT_MS);
    });

    let outcome: Outcome;
    try {
      const response = await Promise.race([
        fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: v.name.trim(),
            email: v.email.trim(),
            message: v.message,
            interestedInCollaboration: v.interestedInCollaboration,
            [HONEYPOT_FIELD]: trailNote,
          }),
          signal: controller.signal,
        }),
        timeout,
      ]);
      const body = await Promise.race([
        response.json().then(
          (b: unknown) => (b && typeof b === 'object' ? (b as Partial<FeedbackResponse>) : null),
          () => null,
        ),
        timeout,
      ]);
      outcome = outcomeOf(response, body);
    } catch {
      outcome = { kind: 'failed', failure: { kind: 'network' } };
    } finally {
      clearTimeout(timer);
    }

    if (id !== requestRef.current) return;
    sendingRef.current = false;
    setSending(false);

    if (outcome.kind === 'ok') {
      setFailure(null);
      setSigned({ name: v.name.trim(), email: v.email.trim(), at: submittedAt });
      return;
    }
    if (outcome.kind === 'validation') {
      const next: Errors = {};
      for (const field of FIELDS) {
        const issue = outcome.fields?.[field];
        if (issue) next[field] = issueMessage(field, issue, v[field]);
      }
      setFailure(null);
      setErrors(next);
      focusNext.current = FIELDS.find((f) => next[f]) ?? null;
      return;
    }
    const failed = outcome.failure;
    setFailure((prev) => ({ failure: failed, seq: (prev?.seq ?? 0) + 1 }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sendingRef.current) return;
    const next: Errors = {};
    for (const field of FIELDS) {
      const message = validateField(field, values[field]);
      if (message) next[field] = message;
    }
    setErrors(next);
    const firstInvalid = FIELDS.find((f) => next[f]);
    if (firstInvalid) {
      setFailure(null);
      focusNext.current = firstInvalid;
      return;
    }
    void send(values);
  }

  function signAgain() {
    setValues(EMPTY);
    setTrailNote('');
    setErrors({});
    setFailure(null);
    setSigned(null);
    focusNext.current = 'name';
  }

  if (signed) {
    return (
      <div
        ref={entryRef}
        role="status"
        tabIndex={-1}
        className="mt-6 rounded-sm outline-offset-4"
      >
        <p className="font-mono text-sm text-ink-muted tabular-nums">
          {formatEntryTime(signed.at)}
        </p>
        <h2 className="mt-2 flex items-center gap-2">
          <CheckCircleIcon size={24} aria-hidden="true" className="shrink-0 text-success" />
          Register signed
        </h2>
        <p className="mt-4 text-base text-ink wrap-anywhere">Signed by {signed.name}.</p>
        <p className="mt-2 text-base text-ink-muted wrap-anywhere">I&apos;ll reply to {signed.email}.</p>
        <button type="button" onClick={signAgain} className={`mt-8 ${SECONDARY}`}>
          Sign again
        </button>
      </div>
    );
  }

  /** The error (when shown) then the hint (Message only), as UI-SPEC "Field error" orders them. */
  const describedBy = (field: FeedbackField) =>
    [errors[field] ? `${field}-error` : null, field === 'message' ? 'message-hint' : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <form
      noValidate
      aria-labelledby="register-title"
      onSubmit={onSubmit}
      className="mt-6 flex flex-col gap-6"
    >
      {/* The message slot (UI-SPEC "Message slot"); hidden while empty, so it adds no gap. */}
      <div className="empty:hidden">
        {failure ? (
          <div
            ref={failureRef}
            role="alert"
            tabIndex={-1}
            aria-labelledby="register-failure-title"
            className="rounded-sm border border-danger bg-surface-overlay p-4"
          >
            <h3
              id="register-failure-title"
              className="flex items-center gap-2 text-base font-semibold text-ink"
            >
              <WarningCircleIcon size={20} aria-hidden="true" className="shrink-0 text-danger" />
              {FAILURE_TITLE[failure.failure.kind]}
            </h3>
            <p className="mt-2 text-base text-ink-muted wrap-break-word">
              <FailureCopy failure={failure.failure} />
            </p>
            {failure.failure.kind === 'send' || failure.failure.kind === 'network' ? (
              <button
                type="button"
                aria-label="Retry sending"
                aria-disabled={sending ? 'true' : undefined}
                onClick={() => void send(values)}
                className={`mt-4 ${SECONDARY}`}
              >
                <ArrowClockwiseIcon size={20} aria-hidden="true" />
                Retry
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div>
        <label htmlFor="name" className={LABEL}>
          Name<span aria-hidden="true" className="text-danger"> *</span>
        </label>
        <input
          ref={(el) => {
            fieldRefs.current.name = el ?? undefined;
          }}
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={FEEDBACK_LIMITS.nameMax}
          required
          readOnly={sending}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={errors.name ? 'true' : undefined}
          aria-describedby={describedBy('name')}
          className={fieldClass(!!errors.name)}
        />
        {errors.name ? (
          <p id="name-error" className="mt-2 text-sm text-danger">
            <span className="sr-only">Error: </span>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="email" className={LABEL}>
          Email<span aria-hidden="true" className="text-danger"> *</span>
        </label>
        <input
          ref={(el) => {
            fieldRefs.current.email = el ?? undefined;
          }}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          required
          readOnly={sending}
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={describedBy('email')}
          className={fieldClass(!!errors.email)}
        />
        {errors.email ? (
          <p id="email-error" className="mt-2 text-sm text-danger">
            <span className="sr-only">Error: </span>
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="message" className={LABEL}>
          Message<span aria-hidden="true" className="text-danger"> *</span>
        </label>
        <textarea
          ref={(el) => {
            fieldRefs.current.message = el ?? undefined;
          }}
          id="message"
          name="message"
          rows={6}
          required
          readOnly={sending}
          value={values.message}
          onChange={(e) => set('message', e.target.value)}
          aria-invalid={errors.message ? 'true' : undefined}
          aria-describedby={describedBy('message')}
          className={`${fieldClass(!!errors.message)} resize-y`}
        />
        {errors.message ? (
          <p id="message-error" className="mt-2 text-sm text-danger">
            <span className="sr-only">Error: </span>
            {errors.message}
          </p>
        ) : null}
        <p id="message-hint" className="mt-2 text-sm text-ink-muted">
          10 to 2,000 characters
        </p>
      </div>

      {/* The honeypot (CONTACT-03): outside the accessibility tree and the Tab order. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="trail-note">Leave this field empty</label>
        <input
          id="trail-note"
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          value={trailNote}
          onChange={(e) => setTrailNote(e.target.value)}
        />
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm text-ink cursor-pointer">
        <input
          type="checkbox"
          name="interestedInCollaboration"
          checked={values.interestedInCollaboration}
          onChange={(e) => {
            if (!sending) set('interestedInCollaboration', e.target.checked);
          }}
          className="size-5 shrink-0 accent-accent"
        />
        I&apos;d like to talk about working together
      </label>

      <button
        type="submit"
        aria-disabled={sending ? 'true' : undefined}
        className={`mt-2 ${PRIMARY}`}
      >
        {sending ? 'Sending…' : 'Send Message'}
      </button>

      <p role="status" className="sr-only">
        {sending ? 'Sending your entry' : ''}
      </p>
    </form>
  );
}
