'use client';

/**
 * Last-resort boundary when the root layout itself fails. It cannot rely on the app's CSS or fonts,
 * so it is plain, readable and self-contained.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#FBFBFD',
          color: '#1D1D1F',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>Something went wrong on our side.</h1>
          <p style={{ color: '#6E6E73', maxWidth: 420, margin: '12px auto 24px' }}>
            Nothing you typed was lost. Try again, or dial the code on any phone.
          </p>
          <button
            onClick={reset}
            style={{ height: 48, padding: '0 28px', borderRadius: 999, border: 0, background: '#A63A18', color: '#FBFBFD', fontSize: 16, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
