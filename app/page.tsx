import Link from "next/link";
import {
  ArrowRight,
  FileUp,
  BrainCircuit,
  LineChart,
  Play,
} from "lucide-react";

const FEATURES = [
  {
    icon: FileUp,
    title: "Upload anything",
    body: "CSV, Excel, JSON, TSV, or plain text — files are converted automatically before the agent ever sees them.",
  },
  {
    icon: BrainCircuit,
    title: "Agentic analysis",
    body: "The agent takes initiative: it profiles your dataset, asks its own research questions, and writes Python to answer them.",
  },
  {
    icon: LineChart,
    title: "Live agent actions",
    body: "Watch code execute and charts render in real time as results stream back, turn by turn.",
  },
];

const STEPS = [
  {
    title: "Upload your file",
    body: "Drop in a dataset up to 2 MB. The agent immediately starts exploring — structure, types, missing values, summary statistics.",
  },
  {
    title: "Watch the agent work",
    body: "It writes and runs pandas, matplotlib, and seaborn code in a sandbox, streaming reasoning, code, output, and visualizations live.",
  },
  {
    title: "Keep exploring",
    body: "Ask follow-up questions in plain English. The dataset stays in context for the whole conversation — no re-uploading.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6">
      {/* nav */}
      <nav className="flex items-center justify-between py-6">
        <span className="font-display text-lg tracking-tight">
          EDA<span className="text-amber">·</span>Agent
        </span>
        <Link
          href="/chat"
          className="rounded-full border border-ink-border px-4 py-1.5 font-mono text-[0.72rem] uppercase tracking-[0.1em] text-paper-dim transition-colors hover:border-amber/60 hover:text-amber"
        >
          Open the agent
        </Link>
      </nav>

      {/* hero */}
      <section className="pt-16 pb-12 text-center sm:pt-24">
        <p className="animate-rise font-mono text-[0.72rem] uppercase tracking-[0.2em] text-amber">
          Exploratory data analysis, autonomously
        </p>
        <h1
          className="animate-rise mx-auto mt-5 max-w-2xl font-display text-5xl leading-[1.05] tracking-tight text-paper sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Talk to your <em className="text-amber">data</em>.
        </h1>
        <p
          className="animate-rise mx-auto mt-6 max-w-xl text-base leading-relaxed text-paper-dim"
          style={{ animationDelay: "160ms" }}
        >
          Upload a dataset and chat with an agentic AI that actually understands
          it — no coding required. Ask questions in plain English and watch the
          agent analyze, visualize, and explain in real time.
        </p>
        <div
          className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            Start analyzing
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/chat?demo=coned"
            className="inline-flex items-center gap-2 rounded-full border border-ink-border-strong px-6 py-3 text-sm text-paper transition-colors hover:border-amber/60 hover:text-amber"
          >
            <Play className="size-4" aria-hidden />
            Try the demo
          </Link>
        </div>
      </section>

      {/* demo video */}
      <section
        className="animate-rise overflow-hidden rounded-xl border border-ink-border bg-ink-raised shadow-[0_24px_80px_-24px_rgba(240,168,63,0.18)]"
        style={{ animationDelay: "320ms" }}
      >
        <div className="flex items-center gap-1.5 border-b border-ink-border bg-ink-panel px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-red/70" aria-hidden />
          <span className="size-2.5 rounded-full bg-amber/70" aria-hidden />
          <span className="size-2.5 rounded-full bg-teal/70" aria-hidden />
          <span className="ml-3 font-mono text-[0.7rem] text-muted">
            eda-agent — live session
          </span>
        </div>
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/assets/demo-loading-placeholder.png"
          className="w-full"
        >
          <source src="/assets/demo-vid.mp4" type="video/mp4" />
        </video>
      </section>
      <p className="mt-4 text-center font-mono text-[0.72rem] uppercase tracking-[0.12em] text-muted">
        A real session: upload, autonomous profiling, charts — all streamed
      </p>

      {/* features */}
      <section className="grid gap-4 pt-20 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-ink-border bg-ink-raised/70 p-6"
          >
            <feature.icon className="size-5 text-amber" aria-hidden />
            <h2 className="mt-4 font-display text-xl text-paper">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-paper-dim">
              {feature.body}
            </p>
          </div>
        ))}
      </section>

      {/* how it works */}
      <section className="pt-20">
        <h2 className="text-center font-display text-3xl tracking-tight text-paper">
          How it works
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="relative">
              <span className="font-mono text-[0.8rem] text-amber">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="mt-2 border-t border-dashed border-ink-border-strong pt-4">
                <h3 className="font-display text-lg text-paper">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* about / closing */}
      <section className="mx-auto max-w-2xl pt-20 text-center">
        <p className="text-sm leading-relaxed text-paper-dim">
          Behind the scenes, the agent is powered by Google Gemini with native
          code execution — it doesn&apos;t just talk about your data, it writes
          and runs pandas, scikit-learn, and seaborn code against it. Whether
          you&apos;re a data scientist speeding up first-pass exploration, an
          analyst meeting a new dataset, or a student learning EDA, it meets you
          where you are.
        </p>
        <Link
          href="/chat"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          Open the agent
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      {/* footer */}
      <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-ink-border py-8">
        <span className="font-mono text-[0.72rem] text-muted">
          MIT licensed · Powered by Google Gemini
        </span>
        <a
          href="https://github.com/Elephant200/exploratory-data-analysis-app"
          className="font-mono text-[0.72rem] text-muted underline underline-offset-4 transition-colors hover:text-amber"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
