"use client";

import { useEffect, useRef, useState } from "react";
import { useReveal } from "./useReveal";
import { useSmoothScroll } from "./useSmoothScroll";
import { useParallax } from "./useParallax";
import { CustomCursor } from "./CustomCursor";
import "./landing.css";

const STATS = [
  { n: "100+", l: "klanten begeleid" },
  { n: "0", l: "langlopende contracten" },
  { n: "3-4 wk", l: "tot eerste resultaat" },
];

const TOOLS = [
  {
    size: "wide",
    photo: 1,
    tag: "Voedingsadvies",
    title: "Voedingsplan op maat",
    body: "Jouw calorieën, macro's en maaltijden — afgestemd op jouw lichaam, agenda en doel. Geen generiek schema.",
    cta: "Bekijk hoe",
  },
  {
    size: "narrow",
    photo: 2,
    tag: "Check-ins",
    title: "Wekelijkse opvolging",
    body: "Elke week bijsturen op basis van echte data, niet giswerk.",
  },
  {
    size: "narrow",
    photo: 3,
    tag: "Support",
    title: "WhatsApp coaching",
    body: "Rechtstreeks contact met je coach, wanneer je het nodig hebt.",
    cta: "Stel je vraag",
  },
  {
    size: "wide",
    photo: 4,
    tag: "Wedstrijdprep",
    title: "Piekfit op de juiste dag",
    body: "Periodisering, peak-weekplanning en posing-begeleiding tot op het podium.",
  },
];

const STEPS = [
  { n: "1", title: "Intake", body: "Een echt gesprek over je doelen, leefstijl en geschiedenis." },
  { n: "2", title: "Strategie", body: "Een volledig persoonlijk plan, afgestemd op jouw lichaam en agenda." },
  { n: "3", title: "Resultaten", body: "We volgen je vooruitgang op de voet en sturen continu bij." },
];

const TESTIMONIALS = [
  { name: "Vincent", role: "Klant sinds 2023", quote: "Alles is op maat, haalbaar en resultaatgericht.", photo: 2 },
  { name: "Luka", role: "Wedstrijdprep", quote: "Hiervoor heb ik met twee andere coaches gewerkt, maar daar miste ik de persoonlijke aanpak.", photo: 3 },
  { name: "Wesley", role: "Klant sinds 2022", quote: "Van twijfel naar discipline. Van discipline naar resultaat.", photo: 4 },
];

const PRICING = [
  { name: "3 maanden", price: "€499", note: "eenmalig, geen contract", features: ["Persoonlijk voedingsplan", "Trainingsschema", "Wekelijkse check-ins", "WhatsApp support"], featured: false },
  { name: "6 maanden", price: "€899", note: "meest gekozen", features: ["Alles uit 3 maanden", "Supplementenadvies", "Mentale coaching", "Prioriteit support"], featured: true },
  { name: "Online coaching", price: "€349", note: "3 maanden", features: ["Voedingsplan op maat", "Check-ins", "WhatsApp support"], featured: false },
];

function Photo({ variant, className = "", tag }: { variant: number; className?: string; tag?: string }) {
  return (
    <div className={`lp-photo lp-photo-${variant} ${className}`}>
      {tag && <span className="lp-photo-tag">📷 {tag}</span>}
    </div>
  );
}

function maskWords(text: string, startIndex: number) {
  const words = text.split(" ");
  return words.map((word, i) => (
    <span key={`${startIndex}-${i}`}>
      <span className="lp-mask">
        <span className="lp-mask-inner" style={{ transitionDelay: `${0.5 + (startIndex + i) * 0.045}s` }}>
          {word}
        </span>
      </span>
      {i < words.length - 1 ? " " : ""}
    </span>
  ));
}

function SectionNum({ n }: { n: string }) {
  return <span className="lp-num lp-section-num">{n}</span>;
}

export default function Landing() {
  useReveal();
  useSmoothScroll();
  const glowRef = useRef<HTMLDivElement>(null);
  const heroPhotoRef = useParallax<HTMLDivElement>(0.12);
  const [heroRevealed, setHeroRevealed] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroRevealed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (glowRef.current) {
      glowRef.current.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
    }
  }

  return (
    <div className="lp lp-dark relative" onMouseMove={handleMouseMove}>
      <div className="lp-grain" />
      <div ref={glowRef} className="lp-glow" />
      <CustomCursor />

      {/* NAV */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 md:px-12 backdrop-blur-md" style={{ background: "rgba(11,11,14,0.6)", borderBottom: "1px solid var(--line)" }}>
        <span className="lp-display text-lg tracking-wide">Oeyen<span style={{ color: "var(--accent)" }}>•</span>Coaching</span>
        <nav className="hidden md:flex items-center gap-8 text-sm opacity-80">
          <a className="lp-underline" href="#aanpak">Aanpak</a>
          <a className="lp-underline" href="#diensten">Diensten</a>
          <a className="lp-underline" href="#resultaten">Resultaten</a>
          <a className="lp-underline" href="#prijzen">Prijzen</a>
        </nav>
        <a href="#intake" className="lp-btn rounded-full px-5 py-2.5 text-sm font-semibold" style={{ background: "var(--paper)", color: "var(--ink)" }}>
          Start nu
        </a>
      </header>

      {/* HERO */}
      <section className="relative z-10 grid grid-cols-1 items-center gap-10 px-6 pb-24 pt-20 md:grid-cols-2 md:px-12 md:pb-32 md:pt-28">
        <div>
          <span className="lp-reveal lp-eyebrow">Online voedings- en wedstrijdcoaching</span>
          <h1 className={`lp-display text-[13vw] leading-[0.85] md:text-[5vw] ${heroRevealed ? "lp-mask-active" : ""}`}>
            {maskWords("Het systeem voor", 0)}
            <br />
            {maskWords("jouw sterkste lichaam", 4)}{" "}
            <span className="lp-mask">
              <span className="lp-mask-inner lp-accent-word" style={{ transitionDelay: "0.85s" }}>
                ooit
              </span>
            </span>
          </h1>
          <p className="lp-reveal mt-8 max-w-md text-lg opacity-70" data-d="2">
            Persoonlijke coaching die elke maaltijd, elke training en elke week omzet in meetbare vooruitgang.
          </p>
          <div className="lp-reveal mt-12 flex flex-wrap gap-4" data-d="3">
            <a id="intake" href="#" data-cursor="Start" className="lp-btn rounded-full px-7 py-4 text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--paper)" }}>
              Start gratis intake
            </a>
            <a href="#diensten" data-cursor="Bekijk" className="lp-btn lp-btn-light rounded-full border px-7 py-4 text-sm font-semibold" style={{ borderColor: "var(--line)" }}>
              Bekijk diensten
            </a>
          </div>
        </div>
        <div className="lp-reveal aspect-[4/5] w-full overflow-hidden rounded-3xl md:aspect-[3/4]" data-d="2">
          <div ref={heroPhotoRef} className="h-full w-full">
            <Photo variant={1} className="h-full w-full" tag="actiefoto klant — vervangen" />
          </div>
        </div>
      </section>

      <div className="lp-reveal lp-stat-row relative z-10 border-y px-6 py-10 md:px-12" style={{ borderColor: "var(--line)" }}>
        {STATS.map((s) => (
          <div key={s.l} className="px-4 text-center first:pl-0 last:pr-0 md:text-left md:first:pl-0">
            <div className="lp-display text-3xl md:text-4xl">{s.n}</div>
            <div className="mt-1 text-sm opacity-60">{s.l}</div>
          </div>
        ))}
      </div>

      {/* TOOLS — bento */}
      <section id="diensten" className="relative z-10 px-6 py-28 md:px-12">
        <div className="lp-reveal lp-section-head mb-4">
          <SectionNum n="01" />
          <span className="lp-eyebrow">Diensten</span>
          <h2 className="lp-display text-5xl md:text-7xl">Tools die je vooruit duwen</h2>
        </div>
        <p className="lp-reveal mb-16 max-w-md text-sm opacity-60">Van voedingsplan tot wedstrijddag — alles wat je nodig hebt op één plek.</p>
        <div className="lp-bento">
          {TOOLS.map((t, i) => (
            <div
              key={t.title}
              className={`lp-reveal lp-card lp-bento-${t.size} flex flex-col justify-between overflow-hidden rounded-3xl border`}
              data-d={String((i % 2) + 1)}
              data-cursor="Bekijk"
              style={{ borderColor: "var(--line)", background: "var(--paper-2)" }}
            >
              <div className="aspect-[16/9] w-full">
                <Photo variant={t.photo} className="h-full w-full" tag="actiefoto" />
              </div>
              <div className="p-7">
                <span className="text-sm opacity-60">{t.tag}</span>
                <h3 className="mt-2 text-2xl font-semibold leading-snug">{t.title}</h3>
                <p className="mt-2 opacity-70">{t.body}</p>
                {t.cta && (
                  <a href="#intake" className="lp-btn lp-btn-light mt-5 inline-block rounded-full border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--line)" }}>
                    {t.cta}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS on photo */}
      <section id="aanpak" className="relative z-10 px-6 py-28 md:px-12">
        <div className="lp-reveal lp-section-head mb-16">
          <SectionNum n="02" />
          <span className="lp-eyebrow">Aanpak</span>
          <h2 className="lp-display text-5xl md:text-7xl">Van twijfel naar momentum</h2>
        </div>
        <div className="lp-reveal relative overflow-hidden rounded-3xl">
          <Photo variant={3} className="absolute inset-0" />
          <div className="relative z-10 grid grid-cols-1 gap-12 p-10 md:grid-cols-3 md:p-16">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="lp-process-num">{s.n}</div>
                <h3 className="mt-4 text-2xl font-semibold" style={{ color: "var(--paper)" }}>{s.title}</h3>
                <p className="mt-3" style={{ color: "rgba(244,242,236,0.7)" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — editorial, no cards */}
      <section id="resultaten" className="relative z-10 px-6 py-28 md:px-12" style={{ background: "var(--paper-2)" }}>
        <div className="lp-reveal lp-section-head mb-20">
          <SectionNum n="03" />
          <span className="lp-eyebrow">Resultaten</span>
          <h2 className="lp-display text-5xl md:text-7xl">Vertrouwd door wie beweegt</h2>
        </div>
        <div className="flex flex-col gap-20 md:gap-28">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className={`lp-reveal lp-testi-row ${i % 2 === 1 ? "lp-testi-flip" : ""}`} data-d={String((i % 3) + 1)}>
              <div className="lp-testi-photo aspect-[4/3] w-full overflow-hidden rounded-3xl md:aspect-[4/5]">
                <Photo variant={t.photo} className="h-full w-full" tag="klantfoto" />
              </div>
              <div className="px-0 py-8 md:px-14">
                <span className="lp-testi-quote-mark">&ldquo;</span>
                <p className="-mt-6 max-w-md text-xl leading-relaxed md:text-2xl">{t.quote}</p>
                <p className="mt-8 text-sm opacity-60">{t.name} — {t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="prijzen" className="relative z-10 px-6 py-28 md:px-12">
        <div className="lp-reveal lp-section-head mb-4">
          <SectionNum n="04" />
          <span className="lp-eyebrow">Prijzen</span>
          <h2 className="lp-display text-5xl md:text-7xl">Start vandaag. Schaal je resultaten.</h2>
        </div>
        <p className="lp-reveal mb-16 max-w-md text-sm opacity-60">Eenmalige betaling. Geen verborgen kosten, geen langlopend contract.</p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-center">
          {PRICING.map((p, i) => (
            <div
              key={p.name}
              className={`lp-reveal flex flex-col p-10 ${p.featured ? "lp-price-featured rounded-3xl" : "lp-card rounded-3xl border"}`}
              data-d={String(i + 1)}
              style={p.featured ? undefined : { borderColor: "var(--line)" }}
            >
              {p.featured ? (
                <span className="lp-price-badge mb-2 self-start">{p.note}</span>
              ) : (
                <span className="text-sm opacity-60">{p.note}</span>
              )}
              <h3 className="mt-2 text-2xl font-semibold">{p.name}</h3>
              <div className="lp-display mt-6 text-5xl">{p.price}</div>
              <ul className="mt-8 flex-1 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3" style={{ opacity: p.featured ? 0.9 : 0.8 }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.featured ? "var(--paper)" : "var(--accent)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#intake"
                className="lp-btn mt-8 rounded-full border px-6 py-3 text-center text-sm font-semibold"
                style={{ borderColor: p.featured ? "var(--paper)" : "var(--line)", color: p.featured ? "var(--paper)" : undefined }}
              >
                Start hier
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA on photo */}
      <section className="relative z-10 px-6 py-20 md:px-12">
        <div className="lp-reveal relative overflow-hidden rounded-3xl px-6 py-24 text-center md:px-12">
          <Photo variant={4} className="absolute inset-0" />
          <div className="relative z-10">
            <h2 className="lp-display text-4xl leading-[0.95] md:text-6xl" style={{ color: "var(--paper)" }}>
              Jouw discipline is macht.
              <br />
              <span style={{ color: "var(--accent)" }}>Jouw moment is nu.</span>
            </h2>
            <a
              href="#intake"
              className="lp-btn lp-btn-light mt-8 inline-block rounded-full px-8 py-4 text-sm font-semibold"
              style={{ background: "var(--paper)", color: "var(--ink)" }}
            >
              Word vandaag lid
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 px-6 pb-12 pt-20 md:px-12" style={{ background: "var(--ink)", color: "var(--paper)" }}>
        <div className="lp-reveal grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <h2 className="lp-display text-4xl leading-[0.95] md:text-6xl">Gebouwd voor wie beweegt.</h2>
            <p className="mt-4 max-w-sm opacity-60">Met Oeyen Coaching wordt elke statistiek een verhaal van vooruitgang.</p>
            <a href="#intake" className="lp-btn lp-btn-light mt-8 inline-block rounded-full px-7 py-3.5 text-sm font-semibold" style={{ background: "var(--paper)", color: "var(--ink)" }}>
              Start gratis intake
            </a>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm opacity-70 md:justify-self-end">
            <div className="flex flex-col gap-3">
              <span className="mb-1 font-semibold opacity-100">Links</span>
              <a className="lp-underline" href="#aanpak">Aanpak</a>
              <a className="lp-underline" href="#diensten">Diensten</a>
              <a className="lp-underline" href="#prijzen">Prijzen</a>
              <a className="lp-underline" href="#intake">Contact</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="mb-1 font-semibold opacity-100">Socials</span>
              <a className="lp-underline" href="#">Instagram</a>
              <a className="lp-underline" href="#">Facebook</a>
              <a className="lp-underline" href="#">TikTok</a>
              <a className="lp-underline" href="#">Strava</a>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t pt-8 text-sm opacity-60 md:flex-row md:items-center md:justify-between" style={{ borderColor: "rgba(244,242,236,0.14)" }}>
          <span>© {new Date().getFullYear()} Oeyen Coaching</span>
          <div className="flex gap-6">
            <a className="lp-underline" href="#">Algemene voorwaarden</a>
            <a className="lp-underline" href="#">Privacybeleid</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
