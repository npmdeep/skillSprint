import { useMemo } from "react";

const badgeIcons = { 1: "🥉", 2: "🥈", 3: "🥇" };

function shortAddr(value = "") {
  if (!value || value.length <= 14) return value || "—";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatMins(totalMinutes) {
  const minutes = Number(totalMinutes || 0);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${minutes}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function RankBadge({ rank }) {
  if (rank === 1) return <span style={{ fontSize: "1.1rem" }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: "1.1rem" }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: "1.1rem" }}>🥉</span>;
  return (
    <span
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "0.78rem",
        color: "var(--ink-muted)",
        minWidth: "1.6rem",
        display: "inline-block",
        textAlign: "center",
      }}
    >
      #{rank}
    </span>
  );
}

export function LeaderboardPanel({ entries = [], isLoading = false, currentAccount = "" }) {
  const ranked = useMemo(
    () =>
      [...entries].sort((a, b) => b.totalMinutes - a.totalMinutes).slice(0, 10),
    [entries]
  );

  return (
    <div className="panel" style={{ marginTop: "2.5rem" }}>
      <h2 className="panel-title">Community Leaderboard</h2>
      <p className="panel-subtitle">
        Top learners ranked by total verified study time on-chain.
      </p>

      {isLoading ? (
        <div className="skeleton-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      ) : ranked.length === 0 ? (
        <p style={{ color: "var(--ink-muted)", fontSize: "0.95rem" }}>
          No learner data available yet. Be the first to log a session!
        </p>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          {ranked.map((entry, idx) => {
            const isMe = entry.learner === currentAccount;
            return (
              <div
                key={entry.learner}
                className="leaderboard-row"
                style={{
                  background: isMe ? "rgba(99,102,241,0.06)" : "transparent",
                  border: isMe ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                  borderRadius: "8px",
                  padding: "0.6rem 0.8rem",
                  marginBottom: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <RankBadge rank={idx + 1} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: "600", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {entry.displayName || shortAddr(entry.learner)}
                    {isMe && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          background: "var(--accent)",
                          color: "#fff",
                          borderRadius: "4px",
                          padding: "0 4px",
                          lineHeight: "1.5",
                        }}
                      >
                        you
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                    {shortAddr(entry.learner)} · {entry.sessionCount} session{entry.sessionCount !== 1 ? "s" : ""}
                    {entry.highestBadge > 0 && (
                      <span style={{ marginLeft: "0.3rem" }}>
                        {badgeIcons[entry.highestBadge] || "🏆"}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>
                    {formatMins(entry.totalMinutes)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>
                    🔥 {entry.currentStreak}d streak
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ranked.length > 0 && (
        <p style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.75rem", textAlign: "right" }}>
          Sourced from on-chain event history · {ranked.length} learner{ranked.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
