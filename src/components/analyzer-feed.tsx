import { formatDistanceToNow } from "date-fns";

export type AnalyzerFinding = {
  id: string;
  type: "ALERT" | "REINFORCEMENT";
  title: string;
  message: string;
  severity: number;
  createdAt: string;
};

type AnalyzerFeedProps = {
  findings: AnalyzerFinding[];
};

export function AnalyzerFeed({ findings }: AnalyzerFeedProps) {
  if (findings.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
        <h2 className="text-lg font-semibold">Analyzer Feed</h2>
        <p className="mt-2 text-sm text-white/70">
          Once you log journals, workouts, and tasks, the analyzer will surface alerts or positive reinforcement here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analyzer Feed</h2>
        <span className="text-xs uppercase tracking-wider text-white/60">Autonomous agent insights</span>
      </div>
      <ul className="mt-4 space-y-3">
        {findings.map((finding) => (
          <li
            key={finding.id}
            className={`rounded-xl border border-white/10 p-4 backdrop-blur ${
              finding.type === "ALERT" ? "bg-rose-900/40" : "bg-emerald-900/30"
            }`}
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-white/70">
              <span>{finding.type === "ALERT" ? "Warning" : "Reinforcement"}</span>
              <span>{formatDistanceToNow(new Date(finding.createdAt), { addSuffix: true })}</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{finding.title}</p>
            <p className="mt-1 text-sm text-white/80">{finding.message}</p>
            <p className="mt-2 text-xs text-white/60">Severity: {finding.severity}/5</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
