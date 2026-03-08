import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import { BlogCTAButton } from "@/app/components/blog/BlogCTAButton";

const TITLE = "How to Play Murder Mystery Alone with AI (No Group Required)";
const DESCRIPTION =
  "You don't need 6-10 friends for a murder mystery. AI characters can fill every role — suspect, witness, red herring. Here's how to play a full whodunit by yourself, any time you want.";
const CANONICAL = "/blog/play-murder-mystery-alone";
const PUBLISHED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "murder mystery alone",
    "play murder mystery solo",
    "murder mystery single player",
    "murder mystery ai",
    "ai murder mystery game",
    "murder mystery by yourself",
    "solo murder mystery",
    "online murder mystery solo",
    "murder mystery no friends",
    "ai detective game solo",
    "murder mystery for one person",
  ],
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: `${SITE_DOMAIN}${CANONICAL}`,
    publishedTime: PUBLISHED,
    authors: [SITE_NAME],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  author: { "@type": "Organization", name: SITE_NAME, url: SITE_DOMAIN },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_DOMAIN,
    logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/icon.svg` },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` },
  faqPage: {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can you play a murder mystery by yourself?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. With AI characters filling the roles of suspects and witnesses, you can run a full murder mystery solo. The AI reacts to your questions, hides information, and lets you reach a real conclusion.",
        },
      },
      {
        "@type": "Question",
        name: "How long does a solo murder mystery take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A typical solo session takes 30-60 minutes depending on how deeply you investigate. You control the pace.",
        },
      },
    ],
  },
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-white mt-14 mb-4 scroll-mt-20">
      {children}
    </h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-bold text-white mt-8 mb-3">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>;
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="shrink-0 w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold flex items-center justify-center">
        {number}
      </div>
      <div>
        <p className="font-bold text-white mb-1">{title}</p>
        <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article className="max-w-3xl mx-auto px-4 py-12 text-zinc-200">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-semibold bg-violet-600/20 border border-violet-500/30 text-violet-300 px-2.5 py-1 rounded-full">
              Solo Play
            </span>
            <span className="text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">
              Murder Mystery
            </span>
            <span className="text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">
              March 2026
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">{TITLE}</h1>
          <p className="text-xl text-zinc-400 leading-relaxed">{DESCRIPTION}</p>
        </div>

        {/* The problem */}
        <P>
          Murder mysteries have always had a logistics problem. You need a big group, everyone has to
          show up at the same time, someone has to prep materials in advance, and at least one person
          will be checking their phone instead of playing.
        </P>
        <P>
          AI changes this completely. Instead of waiting for a calendar to align, you can step into
          a murder mystery right now — just you, a cast of AI suspects, and a crime that needs
          solving.
        </P>
        <P>
          Here is how it works, what makes it surprisingly compelling, and where to actually do it.
        </P>

        <H2 id="how-it-works">How Solo AI Murder Mystery Works</H2>
        <P>
          In a traditional murder mystery, each player takes a role — a suspect, a detective, a
          witness. When you play solo with AI, those same roles exist, but AI characters fill them
          instead of people.
        </P>
        <P>
          What makes this work is that the characters have actual information. Some of them have
          secrets. Some of them are lying. The AI Game Master — the narrator — knows what really
          happened and controls what gets revealed and when. You ask questions, follow leads, and
          piece together the truth.
        </P>
        <P>
          It is not an escape room where you solve a puzzle by finding hidden clues in the room
          description. It is closer to real detective work: you have to decide who to talk to, what
          to ask, and whether you believe the answer.
        </P>

        <H2 id="what-makes-it-good">What Makes a Solo Murder Mystery Actually Good</H2>
        <P>
          Not every AI murder mystery experience is worth your time. The best ones share a few
          qualities:
        </P>
        <ul className="space-y-3 mb-8">
          {[
            {
              label: "Characters who protect their secrets",
              body: "The suspects should be reluctant to talk, evasive, and occasionally misleading. If everyone is immediately helpful and forthcoming, there is no tension.",
            },
            {
              label: "A story that can actually end",
              body: "You should be able to reach a conclusion — you name the killer, explain the motive, and the story resolves. Open-ended chat is fine for some AI apps, but a mystery needs a payoff.",
            },
            {
              label: "Consequences for your choices",
              body: "The direction you investigate should matter. If you spend your time talking to the wrong person, you might miss a key piece of information and have to reconsider your theory.",
            },
            {
              label: "A setting you care about",
              body: "The Clue-style Victorian mansion, a noir detective thriller, a locked mountain lodge — the best AI mysteries use the setting to create atmosphere, not just backdrop.",
            },
          ].map(({ label, body }) => (
            <li key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <p className="text-white font-semibold mb-1">{label}</p>
              <p className="text-zinc-400 text-sm">{body}</p>
            </li>
          ))}
        </ul>

        <H2 id="how-to-play">How to Play — Step by Step</H2>
        <P>
          Here is what a solo murder mystery session looks like on {SITE_NAME}:
        </P>
        <Step
          number={1}
          title="Start a Detective Mystery game"
          description={`Go to ${SITE_NAME} and select the Detective Mystery template. The AI Game Master will set the scene — a crime, a location, and a set of suspects. No prep required.`}
        />
        <Step
          number={2}
          title="Read the setup and meet the suspects"
          description="The narrator introduces you to the victim, the circumstances, and the characters available to interrogate. Each one has a name, a connection to the victim, and something to hide."
        />
        <Step
          number={3}
          title="Start questioning"
          description="You talk to suspects directly. Ask about their alibi, their relationship to the victim, what they saw. The AI characters respond in character — some truthfully, some not."
        />
        <Step
          number={4}
          title="Build your theory"
          description="As you gather information, contradictions will emerge. Someone's alibi doesn't hold up. Two characters have conflicting accounts. The picture starts to form."
        />
        <Step
          number={5}
          title="Accuse and resolve"
          description="When you are ready, name the killer. The story will resolve — either you got it right, or the real culprit explains how you were misled. Either way, the case closes."
        />

        <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-5 mb-10">
          <p className="text-violet-300 font-semibold mb-2">Try it now</p>
          <p className="text-zinc-300 text-sm mb-3">
            A new case is generated every time. No two mysteries are the same.
          </p>
          <BlogCTAButton href="/create?preset=detective-mystery" source="play-murder-mystery-alone-inline">
            Start a Murder Mystery
          </BlogCTAButton>
        </div>

        <H2 id="types-of-mysteries">Types of AI Murder Mysteries You Can Play</H2>
        <P>
          The classic detective setup is just one option. Because you can describe your own scenario,
          the genre is wide open:
        </P>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {[
            {
              title: "Locked Room Mystery",
              desc: "A classic setup: a body found in a room with no way in or out. Pure logical deduction.",
            },
            {
              title: "1920s Noir",
              desc: "Rainy city, corrupt officials, a dame with a secret. Atmosphere-first storytelling.",
            },
            {
              title: "Cozy Mystery",
              desc: "A small village, a local scandal. Low stakes, warm characters, but someone still did it.",
            },
            {
              title: "Sci-Fi Thriller",
              desc: "A murder on a space station, a missing crew member, an AI that might be lying to you.",
            },
            {
              title: "Historical Murder",
              desc: "Set in Victorian England, Renaissance Italy, ancient Rome — period-accurate atmosphere and language.",
            },
            {
              title: "Supernatural Mystery",
              desc: "A haunted estate, a medium, a question of whether the supernatural explanation is real.",
            },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <p className="text-white font-semibold mb-1">{title}</p>
              <p className="text-zinc-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>

        <H2 id="tips">Tips for a Better Solo Experience</H2>
        <H3>Push back when something feels off</H3>
        <P>
          If a character gives you a vague answer, ask a follow-up. &ldquo;You said you were in the
          garden — but the gardener didn&rsquo;t see you. Can you explain that?&rdquo; The AI
          characters respond to pressure. Evasiveness often means there is something worth finding.
        </P>
        <H3>Take notes</H3>
        <P>
          A quick scratch pad goes a long way. Jot down each suspect, their claimed alibi, and the
          first thing that feels inconsistent. When contradictions appear later, you will want to
          reference what you heard earlier.
        </P>
        <H3>Trust your gut on the first interrogation</H3>
        <P>
          The first character you speak to often sets the tone. If they seem nervous, that is
          deliberate. If they are overly helpful, that might be deliberate too. Early impressions
          are worth holding onto even as new information complicates them.
        </P>
        <H3>You can describe your own case</H3>
        <P>
          If you have a specific scenario in mind — a poisoning at a dinner party, a theft at a
          museum that led to a murder — describe it when starting. The AI Game Master will build the
          cast and evidence around your premise.
        </P>

        <H2 id="faq">Frequently Asked Questions</H2>

        <H3>Can you actually play a murder mystery by yourself?</H3>
        <P>
          Yes. With AI characters in every role, a solo murder mystery works as a complete
          experience. The characters are played by the AI — they have their own secrets, their own
          motivations, and they react to your questions in real time.
        </P>

        <H3>How long does a solo session take?</H3>
        <P>
          Most sessions run 30-60 minutes. You control the pace — you can dig deep into every
          character or move quickly toward an accusation. There is no timer.
        </P>

        <H3>Do you always know who did it at the end?</H3>
        <P>
          Yes. The mystery resolves when you make an accusation. If you are right, the story
          confirms it. If you are wrong, you get the real explanation — which is usually more
          satisfying than expected.
        </P>

        <H3>Can you replay the same mystery?</H3>
        <P>
          Each session generates a new mystery, so replaying means a different crime, different
          suspects, different outcome. The template is consistent, but the story is never identical.
        </P>

        <H3>Is there a way to play with others if I want to?</H3>
        <P>
          Yes — {SITE_NAME} supports multiplayer if you want to invite friends. You can play it as
          a collaborative investigation where everyone questions different suspects, or keep it solo.
          Both work.
        </P>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">A New Case, Every Time You Play</h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            No group needed. No scheduling. Start investigating right now — AI characters fill every
            role in the mystery.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <BlogCTAButton href="/create?preset=detective-mystery" source="play-murder-mystery-alone">
              Start Your Case
            </BlogCTAButton>
            <BlogCTAButton href="/" source="play-murder-mystery-alone-home" variant="secondary">
              Browse All Games
            </BlogCTAButton>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-8 text-center">
          <Link
            href="/blog"
            className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>
      </article>
    </>
  );
}
