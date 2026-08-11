// AnalyticsSummary.jsx � Displays per-learner study analytics derived from on-chain dashboard data.
// Includes next-badge milestone progress bar and community learner count.
import { useMemo } from "react";

const badgeThresholds = [
  { minutes: 60, label: "Bronze Learner", icon: "🥉", badge: 1 },
  { minutes: 300, label: "Silver Learner", icon: "🥈", badge: 2 },
  { minutes: 1000, label: "Gold Learner", icon: "🥇", badge: 3 },
];

function ProgressBar({ value, max, color = "var(--accent)" }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div
      style={{
        background: "var(--bg-sand)",
        borderRadius: "999px",
        height: "8px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: "999px",
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

function StatRow({ label, value, note }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: "0.88rem", color: "var(--ink-muted)" }}>{label}</span>
      <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
        {value}
        {note && (
          <span style={{ fontWeight: "400", fontSize: "0.8rem", color: "var(--ink-muted)", marginLeft: "0.4rem" }}>
            {note}
          </span>
        )}
      </span>
    </div>
  );
}

export function AnalyticsSummary({ dashboard, badges = [], totalLearners = null }) {
  const earnedBadgeIds = new Set(badges);

  const nextBadge = useMemo(() => {
    if (!dashboard) return null;
    for (const threshold of badgeThresholds) {
      if (!earnedBadgeIds.has(threshold.badge)) {
        return threshold;
      }
    }
    return null; // all badges earned
  }, [dashboard, earnedBadgeIds]);

  const nextBadgeProgress = useMemo(() => {
    if (!nextBadge || !dashboard) return 0;

    // For bronze, we go from 0 → 60
    const prevThreshold =
      nextBadge.badge === 1
        ? 0
        : badgeThresholds[nextBadge.badge - 2].minutes;
    const span = nextBadge.minutes - prevThreshold;
    const progress = dashboard.totalMinutes - prevThreshold;
    return Math.max(0, Math.min(100, Math.round((progress / span) * 100)));
  }, [nextBadge, dashboard]);

  const daysSinceJoined = useMemo(() => {
    if (!dashboard?.createdAt) return null;
    const diffMs = Date.now() - dashboard.createdAt * 1000;
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }, [dashboard?.createdAt]);

  const avgMinutesPerSession = useMemo(() => {
    if (!dashboard || dashboard.sessionCount === 0) return 0;
    return Math.round(dashboard.totalMinutes / dashboard.sessionCount);
  }, [dashboard]);

  if (!dashboard) {
    return (
      <div className="panel">
        <h2 className="panel-title">Learning Analytics</h2>
        <p style={{ color: "var(--ink-muted)", fontSize: "0.95rem" }}>
          Save a profile and log your first session to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Learning Analytics</h2>
      <p className="panel-subtitle">Your personal study insights from on-chain data.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        <StatRow
          label="Total study time"
          value={formatMinutesLocal(dashboard.totalMinutes)}
          note={`across ${dashboard.sessionCount} sessions`}
        />
        <StatRow
          label="Avg. session length"
          value={`${avgMinutesPerSession} min`}
        />
        {daysSinceJoined !== null && (
          <StatRow
            label="Days since joined"
            value={daysSinceJoined === 0 ? "Today" : `${daysSinceJoined} day${daysSinceJoined === 1 ? "" : "s"}`}
          />
        )}
        <StatRow
          label="Current streak"
          value={`${dashboard.currentStreak} day${dashboard.currentStreak === 1 ? "" : "s"}`}
        />
        <StatRow
          label="Weekly goal"
          value={`${dashboard.minutesThisWeek} / ${dashboard.weeklyGoalMinutes} min`}
          note={dashboard.goalReachedThisWeek ? "✓ Goal reached" : ""}
        />
        {totalLearners !== null && (
          <StatRow
            label="Global learners"
            value={totalLearners.toLocaleString()}
            note="on this contract"
          />
        )}
      </div>

      {/* Next badge progress */}
      <div style={{ marginTop: "1.2rem" }}>
        {nextBadge ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.4rem",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "var(--ink-muted)" }}>
                Next badge: {nextBadge.icon} {nextBadge.label}
              </span>
              <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>
                {nextBadgeProgress}%
              </span>
            </div>
            <ProgressBar value={nextBadgeProgress} max={100} color="var(--accent)" />
            <p style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginTop: "0.35rem" }}>
              {Math.max(0, nextBadge.minutes - dashboard.totalMinutes)} min remaining
            </p>
          </>
        ) : (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--bg-sand)",
              borderRadius: "8px",
              fontSize: "0.88rem",
              color: "var(--ink-muted)",
              textAlign: "center",
            }}
          >
            🏆 All milestone badges earned!
          </div>
        )}
      </div>
    </div>
  );
}

function formatMinutesLocal(totalMinutes) {
  const minutes = Number(totalMinutes || 0);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${minutes}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}
