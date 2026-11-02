/**
 * The summit register (CONTACT-01, CONTACT-02, the client half of CONTACT-03;
 * D-02, D-03; 12-UI-SPEC "Validation and submit states"). Rewritten from the
 * FeedbackForm suite: its eight behaviours (the fields, the three validation
 * errors, a successful submit, a failed submit, the collaboration checkbox
 * and an empty form after a send) carry over against SummitRegister with
 * Tim's approved copy (12-01 copy.field-errors, copy.fail-*).
 *
 * Inline error texts are read through the field's accessible description, so
 * the 12-26 summary (which repeats each message) cannot make them ambiguous.
 * fetch is a jest mock answering duck-typed responses; jsdom has no Response.
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SummitRegister, {
  SEND_TIMEOUT_MS,
  minutesFromRetryAfter,
  validateField,
} from '../SummitRegister';
import { formatEntryTime } from '@/lib/home-format';
import { site } from '@/data/site';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const MESSAGE = 'This is a test message that is long enough.';

/** A duck-typed fetch Response with a JSON body and optional headers. */
function answer(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (key: string) => headers[key] ?? null },
    json: async () => body,
  };
}

const nameField = () => screen.getByLabelText(/name/i) as HTMLInputElement;
const emailField = () => screen.getByLabelText(/email/i) as HTMLInputElement;
const messageField = () => screen.getByLabelText(/message/i) as HTMLTextAreaElement;
const sendButton = () => screen.getByRole('button', { name: /send message/i });

/** Fills valid values without user-event, so it works under fake timers too. */
function fillValid(name = 'John Doe', email = 'john@example.com', message = MESSAGE) {
  fireEvent.change(nameField(), { target: { value: name } });
  fireEvent.change(emailField(), { target: { value: email } });
  fireEvent.change(messageField(), { target: { value: message } });
}

/** The JSON body of the nth fetch call. */
const payload = (n = 0) => JSON.parse((fetchMock.mock.calls[n][1] as RequestInit).body as string);

/** Every field still holds what fillValid typed. */
function expectFieldsKept() {
  expect(nameField()).toHaveValue('John Doe');
  expect(emailField()).toHaveValue('john@example.com');
  expect(messageField()).toHaveValue(MESSAGE);
}

describe('SummitRegister', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders form fields with the locked names and one checkbox', () => {
    render(<SummitRegister />);

    expect(nameField()).toBeInTheDocument();
    expect(emailField()).toHaveAttribute('type', 'email');
    expect(messageField().tagName).toBe('TEXTAREA');
    expect(messageField()).not.toHaveAttribute('maxlength');
    expect(sendButton()).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows validation error for empty name and sends nothing', async () => {
    const user = userEvent.setup();
    render(<SummitRegister />);

    await user.click(sendButton());

    expect(nameField()).toHaveAttribute('aria-invalid', 'true');
    expect(nameField()).toHaveAccessibleDescription('Error: Enter your name.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<SummitRegister />);

    await user.type(nameField(), 'John Doe');
    await user.type(emailField(), 'notanemail');
    await user.type(messageField(), MESSAGE);
    await user.click(sendButton());

    expect(emailField()).toHaveAccessibleDescription(
      'Error: Enter a full email address, with an @ and a domain.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows validation error for short message, then the hint', async () => {
    const user = userEvent.setup();
    render(<SummitRegister />);

    await user.type(nameField(), 'John Doe');
    await user.type(emailField(), 'john@example.com');
    await user.type(messageField(), 'Too short');
    await user.click(sendButton());

    expect(messageField()).toHaveAttribute('aria-invalid', 'true');
    expect(messageField()).toHaveAccessibleDescription(
      'Error: Write at least 10 characters (now 9). 10 to 2,000 characters',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits form successfully and signs the register with the visitor\'s own words', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { code: 'ok' }));
    const user = userEvent.setup();
    render(<SummitRegister />);

    await user.type(nameField(), 'John Doe');
    await user.type(emailField(), 'john@example.com');
    await user.type(messageField(), MESSAGE);
    await user.click(sendButton());

    expect(fetchMock).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({ method: 'POST' }));
    const entry = (await screen.findByText('Register signed')).closest('[role="status"]');
    await waitFor(() => expect(entry).toHaveFocus());
    expect(entry).toHaveTextContent('Register signed');
    expect(entry).toHaveTextContent('Signed by John Doe.');
    expect(entry).toHaveTextContent("I'll reply to john@example.com.");
  });

  it('dates the register entry with formatEntryTime of the submit time', async () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 2, 14, 32, 5) });
    fetchMock.mockResolvedValueOnce(answer(200, { code: 'ok' }));
    render(<SummitRegister />);

    fillValid();
    fireEvent.click(sendButton());

    const entry = await screen.findByText('Register signed');
    const expected = formatEntryTime(new Date(2026, 10, 2, 14, 32));
    expect(expected).toBe('2 Nov 2026 · 14:32');
    expect(entry.closest('[role="status"]')).toHaveTextContent(expected);
  });

  it('shows error message on submission failure and keeps every field', async () => {
    fetchMock.mockResolvedValueOnce(answer(502, { code: 'send-failed' }));
    const user = userEvent.setup();
    render(<SummitRegister />);

    await user.type(nameField(), 'John Doe');
    await user.type(emailField(), 'john@example.com');
    await user.type(messageField(), MESSAGE);
    await user.click(sendButton());

    const box = await screen.findByRole('alert');
    await waitFor(() => expect(box).toHaveFocus());
    expect(box).toHaveTextContent("Couldn't send.");
    expect(box).toHaveTextContent('Your message is still here. Try again, or email me at');
    expect(within(box).getByRole('button', { name: 'Retry sending' })).toBeInTheDocument();
    expect(within(box).getByRole('link')).toHaveAttribute('href', `mailto:${site.email}`);
    expect(screen.queryByText('Register signed')).not.toBeInTheDocument();
    expectFieldsKept();
  });

  it('handles collaboration checkbox and sends it in the payload', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { code: 'ok' }));
    const user = userEvent.setup();
    render(<SummitRegister />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    fillValid();
    await user.click(sendButton());

    expect(payload()).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      message: MESSAGE,
      interestedInCollaboration: true,
      trail_note: '',
    });
  });

  it('clears form after successful submission when the visitor signs again', async () => {
    fetchMock.mockResolvedValueOnce(answer(200, { code: 'ok' }));
    const user = userEvent.setup();
    render(<SummitRegister />);

    fillValid();
    await user.click(sendButton());
    await user.click(await screen.findByRole('button', { name: 'Sign again' }));

    await waitFor(() => expect(nameField()).toHaveFocus());
    expect(nameField()).toHaveValue('');
    expect(emailField()).toHaveValue('');
    expect(messageField()).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(nameField()).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('enters Sending: aria-disabled button, read-only fields, one request for a double click', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<SummitRegister />);

    fillValid();
    await user.dblClick(sendButton());

    const button = screen.getByRole('button', { name: 'Sending…' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(nameField()).toHaveAttribute('readonly');
    expect(messageField()).toHaveAttribute('readonly');
    expect(screen.getByText('Sending your entry')).toBeInTheDocument();
    await user.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('times out a never-settling send after 15 s, keeps the fields and ignores a late answer', async () => {
    jest.useFakeTimers();
    let lateAnswer: (value: unknown) => void = () => {};
    fetchMock.mockReturnValueOnce(new Promise((resolve) => (lateAnswer = resolve)));
    render(<SummitRegister />);

    fillValid();
    fireEvent.click(sendButton());
    expect(SEND_TIMEOUT_MS).toBe(15_000);
    act(() => {
      jest.advanceTimersByTime(14_999);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    const box = await screen.findByRole('alert');
    expect(box).toHaveTextContent("Couldn't reach the server.");
    expect(within(box).getByRole('button', { name: 'Retry sending' })).toBeInTheDocument();
    expect((fetchMock.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(true);
    expectFieldsKept();

    await act(async () => {
      lateAnswer(answer(200, { code: 'ok' }));
    });
    expect(screen.queryByText('Register signed')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('retries with the kept values once while the failure box stays', async () => {
    let second: (value: unknown) => void = () => {};
    fetchMock
      .mockResolvedValueOnce(answer(500, { code: 'server-error' }))
      .mockReturnValueOnce(new Promise((resolve) => (second = resolve)));
    const user = userEvent.setup();
    render(<SummitRegister />);

    fillValid();
    await user.click(sendButton());
    const retry = await screen.findByRole('button', { name: 'Retry sending' });
    await user.dblClick(retry);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(payload(1)).toEqual(payload(0));
    expect(retry).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't send.");

    await act(async () => {
      second(answer(200, { code: 'ok' }));
    });
    expect(await screen.findByText('Register signed')).toBeInTheDocument();
  });

  it.each([
    ['120', 'Try again in 2 minutes, or email me at'],
    ['61', 'Try again in 2 minutes, or email me at'],
    ['30', 'Try again in 1 minute, or email me at'],
    [null, 'Try again later, or email me at'],
  ])('rate limited with Retry-After %s reads "%s" and offers no Retry', async (retryAfter, text) => {
    fetchMock.mockResolvedValueOnce(
      answer(429, { code: 'rate-limited' }, retryAfter ? { 'Retry-After': retryAfter } : {}),
    );
    const user = userEvent.setup();
    render(<SummitRegister />);

    fillValid();
    await user.click(sendButton());

    const box = await screen.findByRole('alert');
    expect(box).toHaveTextContent('Too many attempts.');
    expect(box).toHaveTextContent(text);
    expect(within(box).queryByRole('button')).not.toBeInTheDocument();
    expectFieldsKept();
  });

  it('asks for a reload on origin-rejected, without Retry and with the mailto fallback', async () => {
    fetchMock.mockResolvedValueOnce(answer(403, { code: 'origin-rejected' }));
    const user = userEvent.setup();
    render(<SummitRegister />);

    fillValid();
    await user.click(sendButton());

    const box = await screen.findByRole('alert');
    expect(box).toHaveTextContent("Couldn't verify this page.");
    expect(box).toHaveTextContent('Copy your message, reload the page and send it again');
    expect(within(box).queryByRole('button')).not.toBeInTheDocument();
    expect(within(box).getByRole('link')).toHaveAttribute('href', `mailto:${site.email}`);
    expectFieldsKept();
  });

  it('treats a non-JSON answer as a network failure, never as signed', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });
    const user = userEvent.setup();
    render(<SummitRegister />);

    fillValid();
    await user.click(sendButton());

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't reach the server.");
    expect(screen.queryByText('Register signed')).not.toBeInTheDocument();
  });

  it('maps a server validation answer onto the inline errors', async () => {
    fetchMock.mockResolvedValueOnce(answer(400, { code: 'validation', fields: { email: 'invalid_email' } }));
    const user = userEvent.setup();
    render(<SummitRegister />);

    fillValid();
    await user.click(sendButton());

    await waitFor(() =>
      expect(emailField()).toHaveAccessibleDescription(
        'Error: Enter a full email address, with an @ and a domain.',
      ),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expectFieldsKept();
  });

  it('keeps the honeypot out of the Tab order and the accessibility tree', async () => {
    const user = userEvent.setup();
    const { container } = render(<SummitRegister />);

    const trap = container.querySelector('input[name="trail_note"]') as HTMLInputElement;
    expect(trap).toHaveAttribute('tabindex', '-1');
    expect(trap).toHaveAttribute('autocomplete', 'off');
    expect(trap.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector('label[for="trail-note"]')).toHaveTextContent(
      'Leave this field empty',
    );

    const reached: Element[] = [];
    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      if (document.activeElement) reached.push(document.activeElement);
    }
    expect(reached).not.toContain(trap);
  });

  it('shows no error on an untouched field when it loses focus', async () => {
    const user = userEvent.setup();
    render(<SummitRegister />);

    await user.click(nameField());
    await user.tab();

    expect(nameField()).not.toHaveAttribute('aria-invalid');
    expect(nameField()).not.toHaveAccessibleDescription(/Error/);
  });
});

describe('validateField (CONTACT-02, FEEDBACK_LIMITS)', () => {
  it.each([
    ['name', '', 'Enter your name.'],
    ['name', '   ', 'Enter your name.'],
    ['name', 'Tim', null],
    ['email', '', 'Enter your email address.'],
    ['email', 'tim@', 'Enter a full email address, with an @ and a domain.'],
    ['email', 'tim@example.com', null],
    ['message', '', 'Write a message.'],
    ['message', 'x'.repeat(9), 'Write at least 10 characters (now 9).'],
    ['message', 'x'.repeat(10), null],
    ['message', 'x'.repeat(2000), null],
    ['message', 'x'.repeat(2001), 'Shorten the message to 2,000 characters (now 2,001).'],
  ] as const)('%s %j -> %j', (field, value, expected) => {
    expect(validateField(field, value)).toBe(expected);
  });
});

describe('minutesFromRetryAfter', () => {
  it.each([
    ['120', 2],
    ['61', 2],
    ['60', 1],
    ['1', 1],
    ['0', 1],
    [3600, 60],
    [null, null],
    ['', null],
    ['Wed, 21 Oct 2026 07:28:00 GMT', null],
  ] as const)('%j -> %j', (value, expected) => {
    expect(minutesFromRetryAfter(value)).toBe(expected);
  });
});
