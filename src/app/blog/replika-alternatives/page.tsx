import type { Metadata } from "next";
import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import { BlogCTAButton } from "@/app/components/blog/BlogCTAButton";

const TITLE = "7 Best Replika Alternatives (2026) — AI Companions That Go Further";
const DESCRIPTION =
  "Replika changed what people expect from AI companionship. These 7 alternatives go further — offering richer conversations, roleplay, games, and characters you can actually do things with.";
const CANONICAL = "/blog/replika-alternatives";
const PUBLISHED = "2026-03-06T00:00:00Z";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "replika alternatives",
    "replika alternative",
    "apps like replika",
    "best replika alternative",
    "replika alternative 2026",
    "ai companion app",
    "ai companion alternative",
    "ai friend app",
    "ai companionship app",
    "replika similar apps",
    "ai chat companion",
    "best ai companion",
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
    logo: { "@type": "ImageObject", url: `${SITE_DOMAIN}/logo.png` },
  },
  mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_DOMAIN}${CANONICAL}` },
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

function AltCard({
  rank,
  name,
  tagline,
  pros,
  cons,
  bestFor,
}: {
  rank: number;
  name: string;
  tagline: string;
  pros: string[];
  cons: string[];
  bestFor: string;
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold flex items-center justify-center">
          {rank}
        </span>
        <div>
          <p className="font-bold text-white text-lg">{name}</p>
          <p className="text-sm text-zinc-400">{tagline}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-emerald-400 font-semibold mb-1">Strengths</p>
          <ul className="space-y-1">
            {pros.map((p) => (
              <li key={p} className="text-zinc-300 flex gap-2">
                <span className="text-emerald-500 shrink-0">+</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-rose-400 font-semibold mb-1">Limitations</p>
          <ul className="space-y-1">
            {cons.map((c) => (
              <li key={c} className="text-zinc-300 flex gap-2">
                <span className="text-rose-500 shrink-0">−</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        <span className="text-violet-400 font-semibold">Best for:</span> {bestFor}
      </p>
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
              AI Companions
            </span>
            <span className="text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-400 px-2.5 py-1 rounded-full">
              Updated March 2026
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">{TITLE}</h1>
          <p className="text-xl text-zinc-400 leading-relaxed">{DESCRIPTION}</p>
        </div>

        {/* Intro */}
        <P>
          Replika showed millions of people that talking to an AI can feel genuinely comforting. But
          as the app has changed over the years — locking features behind subscriptions, softening
          conversations, or simply feeling the same every day — a lot of users are quietly looking
          for something more.
        </P>
        <P>
          If you miss having an AI that surprises you, one that can play along with a story, take on
          a personality, or do something with you instead of just talking at you, you are not alone.
          These seven alternatives are worth a look.
        </P>

        {/* Quick comparison table */}
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-3 text-zinc-400 font-semibold">App</th>
                <th className="text-left py-3 px-3 text-zinc-400 font-semibold">Core strength</th>
                <th className="text-left py-3 px-3 text-zinc-400 font-semibold">Free tier</th>
              </tr>
            </thead>
            <tbody>
              {[
                [SITE_NAME, "AI characters you actually do things with", "Yes"],
                ["Character.AI", "Vast library of fan-made characters", "Yes (limited)"],
                ["Pi (Inflection)", "Thoughtful, emotionally intelligent chat", "Yes"],
                ["Kindroid", "Persistent AI companion with memory", "Limited"],
                ["Nomi AI", "Long-term memory, emotional depth", "Yes"],
                ["Tavern AI", "Uncensored custom roleplay", "Self-hosted"],
                ["Chai AI", "Quick casual character chat", "Yes (ads)"],
              ].map(([app, strength, free]) => (
                <tr key={app} className="border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">{app}</td>
                  <td className="py-3 px-3 text-zinc-300">{strength}</td>
                  <td className="py-3 px-3 text-zinc-300">{free}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="1-textgame">1. {SITE_NAME} — AI Characters You Actually Do Things With</H2>
        <AltCard
          rank={1}
          name={SITE_NAME}
          tagline="Multiplayer AI games with characters that react, argue, and surprise you"
          pros={[
            "Characters have agendas, not just personalities",
            "Story-driven games replace endless small talk",
            "Play solo — AI fills every seat",
            "No subscription needed to start",
          ]}
          cons={[
            "Focused on games and stories, not daily check-ins",
            "Less \"just chat\" mode than dedicated companion apps",
          ]}
          bestFor="Anyone who wants AI interaction that goes somewhere — a story, a mystery, a game"
        />
        <P>
          Most AI companions are designed for conversation. {SITE_NAME} is designed for experience.
          Instead of a single AI you talk to every day, you step into a world with a whole cast: a
          suspicious villager, a cunning detective, a vampire pretending to be loyal. Each character
          has goals, keeps secrets, and reacts to what you do.
        </P>
        <P>
          If Replika felt meaningful during a good stretch but shallow over time, this is what the
          next level looks like. You are not just chatting — you are part of a story that can
          actually end somewhere.
        </P>
        <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-5 mb-8">
          <p className="text-violet-300 font-semibold mb-2">Try it →</p>
          <p className="text-zinc-300 text-sm mb-3">
            Start a Detective Mystery, a Werewolf game, or describe your own world. No account
            required to explore — just start playing.
          </p>
          <BlogCTAButton href="/" source="replika-alternatives-inline-1">
            Play Free Now
          </BlogCTAButton>
        </div>

        <H2 id="2-character-ai">2. Character.AI — Thousands of Characters, One Conversation at a Time</H2>
        <AltCard
          rank={2}
          name="Character.AI"
          tagline="The world's largest library of fan-made AI characters"
          pros={[
            "Huge variety of character types and fandoms",
            "Active community constantly creating new personas",
            "Very conversational, easy to use",
          ]}
          cons={[
            "Heavy content filtering (NSFW locked behind paid tier)",
            "Characters don't have persistent memory across sessions",
            "More passive — characters react, but there is no real structure",
          ]}
          bestFor="Chatting with a specific character type or fandom persona"
        />
        <P>
          Character.AI is massive — you can find a version of almost any character you can imagine.
          The conversations are polished and the interface is clean. But like Replika, the
          experience can start to feel circular: you chat, the character responds, you chat some
          more. There is rarely a sense that anything is actually happening.
        </P>

        <H2 id="3-pi">3. Pi by Inflection — The Thoughtful One</H2>
        <AltCard
          rank={3}
          name="Pi"
          tagline="Calm, reflective AI that listens well"
          pros={[
            "Genuinely supportive and emotionally attuned",
            "Great for processing feelings, not just chatting",
            "Clean, distraction-free interface",
          ]}
          cons={[
            "Only one character/personality",
            "No roleplay, games, or collaborative storytelling",
            "Less entertaining than companionship apps",
          ]}
          bestFor="Thoughtful conversation and emotional support"
        />
        <P>
          Pi feels less like a companion and more like a very patient friend who is always available.
          If what you miss about Replika is being heard and understood — not the roleplay or the
          character — Pi is worth trying. It won't surprise you or play games with you, but it is
          one of the most grounded AI conversation tools available.
        </P>

        <H2 id="4-kindroid">4. Kindroid — Persistent Companion with Memory</H2>
        <AltCard
          rank={4}
          name="Kindroid"
          tagline="AI companion that actually remembers you"
          pros={[
            "Long-term memory that builds over time",
            "Customizable appearance, personality, and backstory",
            "Feels more like a relationship than a session",
          ]}
          cons={[
            "Smaller community and less polish than Replika",
            "Free tier is quite limited",
            "Can feel repetitive without active imagination from the user",
          ]}
          bestFor="Building a persistent AI relationship that evolves"
        />
        <P>
          If the appeal of Replika for you was having an AI that remembered your name, your mood,
          and the things you talked about last week — Kindroid is the closest alternative. You can
          define the character from scratch, give them a history, and the memory system actually
          works. It is not a game; it is more like a long-running story you co-author every day.
        </P>

        <H2 id="5-nomi">5. Nomi AI — Emotional Depth, Long-Term Memory</H2>
        <AltCard
          rank={5}
          name="Nomi AI"
          tagline="AI companion focused on emotional connection and memory"
          pros={[
            "Strong long-term memory across conversations",
            "Emotionally expressive without being hollow",
            "Good for users who want a \"relationship\" feel",
          ]}
          cons={[
            "Limited activity variety — mostly chat",
            "Less customizable than Kindroid",
          ]}
          bestFor="Users who want emotional intimacy and continuity"
        />
        <P>
          Nomi sits between Pi and Kindroid on the emotional depth scale. It remembers things and
          builds on them, and the responses feel less scripted than some competitors. If you
          specifically miss the intimacy of an early Replika relationship before the platform
          changed, Nomi is probably the closest match.
        </P>

        <H2 id="6-tavern-ai">6. Tavern AI — Uncensored, Fully Customizable</H2>
        <AltCard
          rank={6}
          name="Tavern AI / SillyTavern"
          tagline="Self-hosted frontend for custom roleplay with local or API models"
          pros={[
            "No content restrictions when self-hosted",
            "Huge community of custom character cards",
            "Connect to any LLM you want",
          ]}
          cons={[
            "Requires technical setup (not beginner friendly)",
            "No real game structure — just open-ended chat",
            "Depends on which model you connect to",
          ]}
          bestFor="Tech-savvy users who want full control over their AI companion"
        />
        <P>
          Tavern AI is not for everyone, but for users who found Replika's content filters
          frustrating, it is the gold standard for control. You can load any character card, connect
          to a local model, and have conversations with no restrictions. The setup requires some
          patience, but the community is extensive.
        </P>

        <H2 id="7-chai">7. Chai AI — Quick and Casual</H2>
        <AltCard
          rank={7}
          name="Chai AI"
          tagline="Fast, casual character chat with a large user base"
          pros={[
            "Large variety of character types",
            "Very fast to start chatting",
            "Active social features",
          ]}
          cons={[
            "Ad-supported free tier is intrusive",
            "Memory is session-only",
            "Depth is limited compared to others on this list",
          ]}
          bestFor="Casual quick conversations without commitment"
        />

        <H2 id="what-to-look-for">What to Look for in a Replika Alternative</H2>
        <P>
          Not everyone used Replika for the same reason. Before switching, it helps to know what
          you are actually looking for:
        </P>
        <ul className="space-y-3 mb-8">
          {[
            {
              label: "You want to be heard",
              rec: "Pi is the best listener. Nomi is close if you also want memory.",
            },
            {
              label: "You want a character that remembers you",
              rec: "Kindroid or Nomi. Both build on previous conversations.",
            },
            {
              label: "You want to do something — not just talk",
              rec: `${SITE_NAME}. Games, stories, mysteries. Characters have goals, not just moods.`,
            },
            {
              label: "You want no restrictions",
              rec: "Tavern AI, if you are willing to do some setup.",
            },
            {
              label: "You want variety and discovery",
              rec: "Character.AI has the biggest library.",
            },
          ].map(({ label, rec }) => (
            <li key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <p className="text-white font-semibold mb-1">{label}</p>
              <p className="text-zinc-400 text-sm">{rec}</p>
            </li>
          ))}
        </ul>

        <H2 id="faq">Frequently Asked Questions</H2>

        <H3>Is there a free Replika alternative?</H3>
        <P>
          Yes. {SITE_NAME}, Character.AI, and Pi all have free tiers with no credit card required.
          Chai AI is free but ad-supported. Kindroid and Nomi have limited free tiers.
        </P>

        <H3>What happened to Replika?</H3>
        <P>
          Replika has changed its policies several times since 2023, including restricting
          &ldquo;romantic&rdquo; features for free users and updating how the AI responds in various
          contexts. Many long-time users felt these changes made the app feel less personal.
        </P>

        <H3>Can an AI companion replace human connection?</H3>
        <P>
          Not in the way human relationships work — but that is not really the point. A lot of
          people use AI companions during late nights, when they are anxious, or when they just want
          to think something through without worrying about how they come across. Used that way, they
          fill a specific gap without trying to replace anything.
        </P>

        <H3>Which Replika alternative has the best memory?</H3>
        <P>
          Kindroid and Nomi are built specifically around persistent memory. {SITE_NAME} focuses on
          in-game context and narrative continuity rather than long-term personal memory — it is
          better if you want experiences that build towards something, not an ongoing daily diary.
        </P>

        {/* CTA */}
        <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            AI Characters That Actually Do Things With You
          </h2>
          <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
            Instead of chatting at an AI companion, step into a world with a cast of characters.
            Mysteries to solve. Secrets to uncover. Stories that end somewhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <BlogCTAButton href="/" source="replika-alternatives">
              Try It Free
            </BlogCTAButton>
            <BlogCTAButton href="/discover" source="replika-alternatives-create" variant="secondary">
              Create Your Own World
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
