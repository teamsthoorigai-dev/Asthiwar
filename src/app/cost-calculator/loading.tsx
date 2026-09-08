export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="status"
      aria-label="Loading cost calculator"
    >
      {/* Top bar skeleton */}
      <div
        style={{
          borderBottom: '1px solid var(--hairline)',
          background: 'var(--bg)',
          padding: 'var(--s-4)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--container)',
            marginInline: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '18px',
              background: 'var(--surface)',
              borderRadius: 0,
            }}
          />
          <div
            style={{
              width: '80px',
              height: '18px',
              background: 'var(--surface)',
              borderRadius: 0,
            }}
          />
        </div>
      </div>

      {/* Main content skeleton */}
      <main
        style={{
          flex: 1,
          maxWidth: 'var(--container)',
          width: '100%',
          marginInline: 'auto',
          padding: 'var(--s-8) var(--s-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--s-6)',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '14px',
            background: 'var(--surface)',
            borderRadius: 0,
          }}
        />
        <div
          style={{
            width: 'min(420px, 80%)',
            height: '36px',
            background: 'var(--surface)',
          }}
        />
        <div
          style={{
            width: 'min(560px, 95%)',
            height: '20px',
            background: 'var(--surface)',
          }}
        />

        {/* Skeleton Card Box */}
        <div
          style={{
            width: 'min(640px, 100%)',
            minHeight: '380px',
            border: '1px solid var(--hairline)',
            background: 'var(--surface)',
            marginTop: 'var(--s-4)',
            padding: 'var(--s-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--s-4)',
          }}
        >
          <div
            style={{
              width: '40%',
              height: '20px',
              background: 'var(--bg)',
            }}
          />
          <div
            style={{
              width: '100%',
              height: '48px',
              background: 'var(--bg)',
              border: '1px solid var(--hairline)',
            }}
          />
          <div
            style={{
              width: '100%',
              height: '48px',
              background: 'var(--bg)',
              border: '1px solid var(--hairline)',
            }}
          />
          <div
            style={{
              width: '100%',
              height: '48px',
              background: 'var(--bg)',
              border: '1px solid var(--hairline)',
            }}
          />
        </div>
      </main>
    </div>
  );
}
