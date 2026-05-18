import Link from 'next/link'

const S = {
  page: { minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '64px 16px 80px' },
  card: { width: '100%', maxWidth: '580px' },
  logo: { textAlign: 'center' as const, marginBottom: '64px' },
  tag: { display: 'inline-block', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#555', border: '1px solid #222', borderRadius: '99px', padding: '4px 14px', marginBottom: '24px' },
  h1: { fontSize: '2rem', fontWeight: 800, lineHeight: 1.15, color: '#FFF', marginBottom: '16px', textAlign: 'center' as const },
  sub: { fontSize: '0.92rem', color: '#666', lineHeight: 1.7, textAlign: 'center' as const, marginBottom: '56px' },
  divider: { height: '1px', background: '#1A1A1A', marginBottom: '40px' },
  stepList: { display: 'flex', flexDirection: 'column' as const, gap: '20px', marginBottom: '48px' },
  step: { display: 'flex', gap: '18px', alignItems: 'flex-start' },
  stepNum: { width: '28px', height: '28px', borderRadius: '50%', background: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: '#888' },
  stepTitle: { fontSize: '0.9rem', fontWeight: 600, color: '#FFF', marginBottom: '4px' },
  stepDesc: { fontSize: '0.82rem', color: '#555', lineHeight: 1.6 },
  pillGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '48px' },
  pill: { background: '#111', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '16px', textAlign: 'center' as const },
  pillIcon: { fontSize: '1.2rem', marginBottom: '8px' },
  pillLabel: { fontSize: '0.78rem', color: '#888', fontWeight: 500 },
  cta: { display: 'block', width: '100%', padding: '16px', borderRadius: '12px', background: '#FFF', color: '#000', textAlign: 'center' as const, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', marginBottom: '16px' },
  ctaNote: { textAlign: 'center' as const, fontSize: '0.75rem', color: '#444' },
}

const STEPS = [
  {
    title: 'Vul de intake in',
    desc: 'Vertel ons alles over je doelen, levensstijl, gezondheid en trainingsachtergrond. Dit duurt ongeveer 5–10 minuten.',
  },
  {
    title: 'Persoonlijk kennismakingsgesprek',
    desc: 'Je coach neemt contact op voor een kort gesprek om alles te bespreken en je traject op te starten.',
  },
  {
    title: 'Gepersonaliseerd plan',
    desc: 'Je ontvangt een voedingsplan en trainingsschema volledig afgestemd op jouw situatie en doelen.',
  },
  {
    title: 'Wekelijkse begeleiding',
    desc: 'Via het clientportaal check je dagelijks in en geeft je coach feedback elke week.',
  },
]

const PILLARS = [
  { icon: '🥗', label: 'Voedingsbegeleiding' },
  { icon: '🏋️', label: 'Trainingsprogramma' },
  { icon: '📊', label: 'Progressie tracking' },
  { icon: '💬', label: 'Wekelijkse feedback' },
]

export default function IntakeLanding() {
  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Logo */}
        <div style={S.logo}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '3px', color: '#FFF' }}>OEYEN</div>
          <div style={{ fontSize: '0.5rem', letterSpacing: '5px', color: '#444', marginTop: '2px' }}>COACHING</div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={S.tag}>Online coaching</span>
          <h1 style={S.h1}>Start je transformatie</h1>
          <p style={S.sub}>
            Resultaten behaal je niet met een standaard plan. Oeyen Coaching biedt volledig gepersonaliseerde begeleiding — van voeding en training tot herstel en mindset.
          </p>
        </div>

        <div style={S.divider} />

        {/* What you get */}
        <p style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#555', marginBottom: '20px' }}>Wat je krijgt</p>
        <div style={S.pillGrid}>
          {PILLARS.map(({ icon, label }) => (
            <div key={label} style={S.pill}>
              <div style={S.pillIcon}>{icon}</div>
              <div style={S.pillLabel}>{label}</div>
            </div>
          ))}
        </div>

        <div style={S.divider} />

        {/* Process steps */}
        <p style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#555', marginBottom: '20px' }}>Hoe het werkt</p>
        <div style={S.stepList}>
          {STEPS.map((step, i) => (
            <div key={i} style={S.step}>
              <div style={S.stepNum}>{i + 1}</div>
              <div>
                <p style={S.stepTitle}>{step.title}</p>
                <p style={S.stepDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/intake/formulier" style={S.cta}>
          Intake invullen →
        </Link>
        <p style={S.ctaNote}>Gratis en vrijblijvend · Duurt ~10 minuten</p>
      </div>
    </div>
  )
}
