'use client';

import { useCallback, useRef, useState } from 'react';
import { USSD_SERVICE_CODE, USSD_SERVICE_CODE_BASE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Phone } from './phone';

/** Africa's Talking shows at most 182 characters per USSD screen. */
const SCREEN_LIMIT = 182;
/** Africa's Talking drops the session if the handler takes longer than this. */
const AT_TIMEOUT_MS = 3000;

type Status = 'idle' | 'loading' | 'session' | 'ended' | 'error';

interface LogEntry {
  id: number;
  time: string;
  request: { sessionId: string; serviceCode: string; phoneNumber: string; text: string };
  reply: string;
  ms: number;
}

const SHORTCUT = new RegExp(`^${USSD_SERVICE_CODE_BASE.replace(/\*/g, '\\*')}((?:\\*\\d+)*)#$`);

const QUICK_PATHS = [
  { label: 'GPA for an A, full aid', path: '1*1*1' },
  { label: 'Deadlines', path: '2' },
  { label: 'Check an agency', path: '4' },
];

/**
 * Interactive USSD phone that talks to the real /api/at/ussd route with the same form fields
 * Africa's Talking sends. Digits, * and # only. Shows the raw request and reply for judges.
 */
export function UssdSimulator() {
  const [phoneNumber, setPhoneNumber] = useState('+254712345678');
  const [dial, setDial] = useState(USSD_SERVICE_CODE);
  const [entry, setEntry] = useState('');
  const [path, setPath] = useState('');
  const [message, setMessage] = useState('Dial the code, then press Call.');
  const [status, setStatus] = useState<Status>('idle');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [sms, setSms] = useState<string | null>(null);
  const sessionRef = useRef('');
  const logId = useRef(0);

  const request = useCallback(
    async (text: string) => {
      setStatus('loading');
      setSms(null);
      if (!sessionRef.current) sessionRef.current = `SIM_${Date.now()}`;
      const body = {
        sessionId: sessionRef.current,
        serviceCode: USSD_SERVICE_CODE,
        phoneNumber,
        text,
      };
      const started = performance.now();
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 10000);
      try {
        const res = await fetch('/api/at/ussd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const raw = await res.text();
        const ms = Math.round(performance.now() - started);
        const isEnd = raw.startsWith('END ');
        setMessage(raw.replace(/^(CON|END)\s+/, ''));
        setStatus(isEnd ? 'ended' : 'session');
        setPath(text);
        setEntry('');
        if (isEnd) sessionRef.current = '';
        if (isEnd && text.startsWith('1*')) {
          setSms('Your KCSE grade is converted and the next steps are on their way. Check your messages.');
        }
        setLog((prev) =>
          [
            {
              id: ++logId.current,
              time: new Date().toLocaleTimeString('en-GB'),
              request: body,
              reply: raw,
              ms,
            },
            ...prev,
          ].slice(0, 6)
        );
      } catch {
        setMessage('Connection problem. Please try again.');
        setStatus('error');
        sessionRef.current = '';
      } finally {
        window.clearTimeout(timer);
      }
    },
    [phoneNumber]
  );

  const call = useCallback(() => {
    const match = dial.match(SHORTCUT);
    if (!match) {
      setMessage('Invalid USSD code. Dial ' + USSD_SERVICE_CODE);
      setStatus('error');
      return;
    }
    sessionRef.current = '';
    void request(match[1] ? match[1].slice(1) : '');
  }, [dial, request]);

  const send = useCallback(() => {
    if (!entry) return;
    void request(path ? `${path}*${entry}` : entry);
  }, [entry, path, request]);

  const reset = useCallback(() => {
    sessionRef.current = '';
    setStatus('idle');
    setMessage('Dial the code, then press Call.');
    setDial(USSD_SERVICE_CODE);
    setEntry('');
    setPath('');
    setSms(null);
  }, []);

  const inSession = status === 'session';
  const loading = status === 'loading';
  const inputValue = inSession ? entry : dial;

  const onType = (raw: string) => {
    if (inSession) setEntry(raw.replace(/[^0-9]/g, '').slice(0, 12));
    else setDial(raw.replace(/[^0-9*#]/g, '').slice(0, 40));
  };

  const onKey = (key: string) => {
    if (loading) return;
    if (inSession) {
      if (/\d/.test(key)) setEntry((v) => (v + key).slice(0, 12));
    } else {
      if (status === 'ended' || status === 'error') {
        setStatus('idle');
        setMessage('Dial the code, then press Call.');
        setDial(key);
      } else setDial((v) => (v + key).slice(0, 40));
    }
  };

  const runPath = (p: string) => {
    sessionRef.current = '';
    setDial(`${USSD_SERVICE_CODE_BASE}*${p}#`);
    void request(p);
  };

  const length = status === 'idle' || status === 'error' ? 0 : message.length;

  const screen = (
    <div className="flex min-h-[15.5rem] flex-col justify-between font-mono text-[13px] leading-relaxed text-phosphor">
      <div className="flex items-center justify-between border-b border-phosphor/15 pb-2 text-[11px] text-phosphor/70">
        <span>SAFARICOM</span>
        <span aria-live="polite">{loading ? 'Sending…' : inSession ? 'USSD session' : status === 'ended' ? 'Session ended' : 'Ready'}</span>
      </div>

      <p className="whitespace-pre-line py-3" aria-live="polite">
        {loading ? 'Contacting the gateway…' : message}
      </p>

      <div>
        <div className="flex items-center gap-2 border-t border-phosphor/15 pt-2">
          <span aria-hidden="true" className="text-phosphor/60">
            &gt;
          </span>
          <input
            value={inputValue}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              if (inSession) send();
              else call();
            }}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            aria-label={inSession ? 'Your reply, digits only' : 'USSD code, digits star and hash only'}
            className="w-full bg-transparent text-right font-mono text-[13px] text-phosphor placeholder:text-phosphor/40 focus:outline-none focus-visible:outline-none"
            placeholder={inSession ? 'Enter a number' : USSD_SERVICE_CODE}
          />
        </div>
        <p className={cn('tnum mt-1 text-right text-[10px]', length > SCREEN_LIMIT ? 'text-saffron' : 'text-phosphor/50')}>
          {length > 0 ? `${length} / ${SCREEN_LIMIT} characters${length > SCREEN_LIMIT ? ' (too long for AT)' : ''}` : ' '}
        </p>
      </div>
    </div>
  );

  const slow = log[0] && log[0].ms > AT_TIMEOUT_MS;

  return (
    <div className="w-full">
      <Phone
        screen={screen}
        onKey={onKey}
        onCall={inSession ? send : call}
        onEnd={reset}
        callLabel={inSession ? 'Send' : 'Call'}
        disabled={loading}
      />

      {sms && (
        <div className="mx-auto mt-5 w-[min(21rem,86vw)] animate-rise rounded-2xl bg-surface p-4 text-sm text-fg ring-1 ring-inset ring-line/15">
          <p className="mb-1 text-micro font-medium uppercase text-fg2">SMS preview from PEPEA</p>
          <p>{sms}</p>
        </div>
      )}

      <div className="mx-auto mt-6 flex w-[min(21rem,86vw)] flex-wrap items-center gap-2">
        <span className="text-micro uppercase text-fg2">Try a path</span>
        {QUICK_PATHS.map((q) => (
          <button
            key={q.path}
            type="button"
            onClick={() => runPath(q.path)}
            disabled={loading}
            className="tnum rounded-full bg-surface px-3 py-1.5 font-mono text-xs text-fg ring-1 ring-inset ring-line/15 transition-[transform,box-shadow] duration-200 ease-quart-out hover:ring-line/40 active:scale-95 disabled:opacity-50"
          >
            {q.path} <span className="font-sans text-fg2">{q.label}</span>
          </button>
        ))}
      </div>

      <div className="mx-auto mt-4 w-[min(21rem,86vw)] lg:w-full lg:max-w-md">
        <label className="mb-3 block text-micro uppercase text-fg2" htmlFor="sim-number">
          Your number
        </label>
        <input
          id="sim-number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, '').slice(0, 14))}
          inputMode="tel"
          className="mb-4 h-10 w-full rounded-xl bg-surface px-3 font-mono text-sm text-fg ring-1 ring-inset ring-line/15 focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <button
          type="button"
          onClick={() => setShowLog((v) => !v)}
          aria-expanded={showLog}
          aria-controls="ussd-log"
          className="text-sm text-accent underline-offset-4 hover:underline"
        >
          {showLog ? 'Hide request log' : 'Show request log'}
        </button>
        {slow && (
          <p className="mt-2 text-sm text-accent" role="status">
            That reply took over {AT_TIMEOUT_MS / 1000} seconds. Africa's Talking would have dropped the session.
          </p>
        )}

        {showLog && (
          <div id="ussd-log" className="thin-scroll mt-3 max-h-72 overflow-auto rounded-2xl bg-ink p-4 font-mono text-[11px] leading-relaxed text-snow/80 ring-1 ring-white/10">
            {log.length === 0 && <p className="text-snow/50">No requests yet. Dial the code.</p>}
            {log.map((e) => (
              <div key={e.id} className="mb-3 border-b border-white/10 pb-3 last:mb-0 last:border-0 last:pb-0">
                <p className="text-snow/50">
                  {e.time} · POST /api/at/ussd · {e.ms} ms
                </p>
                <p>
                  sessionId={e.request.sessionId}
                  <br />
                  phoneNumber={e.request.phoneNumber}
                  <br />
                  text=&quot;{e.request.text}&quot;
                </p>
                <p className="mt-1 whitespace-pre-line text-phosphor">{e.reply}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
