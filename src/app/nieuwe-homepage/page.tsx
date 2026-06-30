import type { Metadata } from "next";
import { Anton, Instrument_Serif } from "next/font/google";
import Landing from "./Landing";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const accent = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-accent",
});

export const metadata: Metadata = {
  title: "Oeyen Coaching — Het systeem voor jouw sterkste lichaam ooit",
  description: "Online voedings- en wedstrijdcoaching op maat.",
};

export default function NieuweHomepage() {
  return (
    <div className={`${display.variable} ${accent.variable}`}>
      <Landing />
    </div>
  );
}
