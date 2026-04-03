import type { Metadata } from "next";
import { CaseLibrary } from "./case-library";

export const metadata: Metadata = {
  title: "Script Kill — AI Murder Mystery Cases",
  description:
    "Browse AI-powered murder mystery cases. Pick a case, interrogate AI suspects, collect evidence, and solve the crime. Play solo in 10-20 minutes.",
  alternates: { canonical: "/cases" },
};

export default function CasesPage() {
  return <CaseLibrary />;
}
