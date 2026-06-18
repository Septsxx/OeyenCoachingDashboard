type ProgressBarProps = {
  min: number
  max: number
  value: number
  label?: string
}

export function ProgressBar({ min, max, value, label }: ProgressBarProps) {
  const pct = Math.round(((value - min) / (max - min)) * 100)

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#555' }}>{label}</span>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>{pct}%</span>
        </div>
      )}
      <div style={{ height: '4px', background: '#E5E5E3', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: '#111',
          borderRadius: '99px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}
