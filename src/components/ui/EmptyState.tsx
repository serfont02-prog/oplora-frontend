import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  details?: ReactNode[];
};

export default function EmptyState({
  icon,
  eyebrow,
  title,
  description,
  actions,
  details = [],
}: EmptyStateProps) {
  return (
    <section
      aria-labelledby="empty-state-title"
      style={{
        width: '100%',
        maxWidth: 560,
        margin: '0 auto',
        display: 'grid',
        gap: 'var(--op-space-4)',
      }}
    >
      <div
        className="op-elevated-surface"
        style={{
          borderRadius: 'var(--op-radius-xl)',
          padding: 'clamp(24px, 6vw, 36px)',
          background:
            'linear-gradient(180deg, rgba(255,253,248,0.98), rgba(255,253,248,0.94)), radial-gradient(circle at top left, rgba(31,124,255,0.14), transparent 38%)',
        }}
      >
        {icon ? (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--op-radius-lg)',
              background: 'var(--op-color-primary-soft)',
              color: 'var(--op-color-primary-strong)',
              display: 'grid',
              placeItems: 'center',
              marginBottom: 'var(--op-space-5)',
            }}
          >
            {icon}
          </div>
        ) : null}

        {eyebrow ? <div className="op-kicker">{eyebrow}</div> : null}

        <h1
          id="empty-state-title"
          style={{
            margin: eyebrow ? 'var(--op-space-2) 0 0' : 0,
            color: 'var(--op-color-ink)',
            fontSize: 'clamp(1.65rem, 5vw, 2.25rem)',
            lineHeight: 1.08,
            fontWeight: 850,
            letterSpacing: 0,
          }}
        >
          {title}
        </h1>

        {description ? (
          <p
            style={{
              margin: 'var(--op-space-3) 0 0',
              color: 'var(--op-color-ink-soft)',
              fontSize: 15,
              lineHeight: 1.65,
              maxWidth: 480,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>

      {details.length > 0 ? (
        <div
          className="op-elevated-surface"
          style={{
            borderRadius: 'var(--op-radius-lg)',
            padding: 'var(--op-space-4)',
            display: 'grid',
            gap: 'var(--op-space-3)',
          }}
        >
          {details.map((detail, index) => (
            <div
              key={index}
              style={{
                color: 'var(--op-color-ink-soft)',
                fontSize: 14,
                lineHeight: 1.5,
                fontWeight: 650,
              }}
            >
              {detail}
            </div>
          ))}
        </div>
      ) : null}

      {actions ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--op-space-3)' }}>
          {actions}
        </div>
      ) : null}
    </section>
  );
}
