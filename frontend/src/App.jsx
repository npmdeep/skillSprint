import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  configuredContractId,
  configuredRewardsContractId,
  configuredNetworkPassphrase,
  connectWallet,
  discoverWalletState,
  formatDate,
  formatMinutes,
  getExplorerLink,
  getNetworkLabel,
  hasContractConfig,
  isFreighterInstalled,
  logSession,
  parseError,
  readContractEvents,
  readDashboard,
  readRecentSessions,
  readBadges,
  readTotalLearners,
  readLeaderboard,
  saveProfile,
  shortAddress,
  updateWeeklyGoal
} from "./lib/skillSprint";
import { AnalyticsSummary } from "./components/AnalyticsSummary";
import { LeaderboardPanel } from "./components/LeaderboardPanel";

const emptyWallet = {
  account: "",
  network: "",
  networkPassphrase: "",
  rpcUrl: "",
  isConnecting: false,
  error: ""
};

const emptyTx = {
  status: "idle",
  message: "",
  hash: ""
};

// Badge definitions for known milestone IDs (1=Bronze, 2=Silver, 3=Gold)`nconst badgeDefinitions = {
  1: { name: "Bronze Learner", desc: "Logged 60+ minutes of total study time", icon: "🥉" },
  2: { name: "Silver Learner", desc: "Logged 300+ minutes of total study time", icon: "🥈" },
  3: { name: "Gold Learner", desc: "Logged 1000+ minutes of total study time", icon: "🥇" }
};

function MetricCard({ label, value, note }) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <div className="metric-value">{value}</div>
      <p className="metric-note">{note}</p>
    </article>
  );
}

function EventCard({ event }) {
  return (
    <article className="event-card">
      <div className="event-header">
        <span className="event-title">{event.label}</span>
        <span className="event-time">{new Date(event.occurredAt).toLocaleTimeString()}</span>
      </div>
      <p className="event-details">{event.summary}</p>
      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--ink-muted)' }}>Learner: {shortAddress(event.learner)}</span>
        <a className="event-link" href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`} target="_blank" rel="noreferrer">
          Explorer ↗
        </a>
      </div>
    </article>
  );
}

// Inline form validation error — replaces alert() with a styled message
function FormError({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      style={{
        color: "#bf4f36",
        fontSize: "0.82rem",
        margin: "0.25rem 0 0",
        padding: "0.35rem 0.5rem",
        background: "rgba(191,79,54,0.08)",
        borderRadius: "5px",
        border: "1px solid rgba(191,79,54,0.25)"
      }}
    >
      {message}
    </p>
  );
}

// Skeleton placeholder for loading states
function SkeletonCard() {
  return (
    <div
      style={{
        height: "80px",
        borderRadius: "10px",
        background: "linear-gradient(90deg, var(--bg-sand) 25%, #e8e8e4 50%, var(--bg-sand) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite"
      }}
    />
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const [wallet, setWallet] = useState(emptyWallet);
  const [txState, setTxState] = useState(emptyTx);
  const [profileForm, setProfileForm] = useState({ displayName: "", weeklyGoalMinutes: "240" });
  const [profileError, setProfileError] = useState("");
  const [goalForm, setGoalForm] = useState("300");
  const [goalError, setGoalError] = useState("");
  const [sessionForm, setSessionForm] = useState({ topic: "", minutesSpent: "45" });
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let watcher = null;

    async function syncWallet() {
      try {
        const nextState = await discoverWalletState();
        if (!isMounted) return;
        setWallet((current) => ({ ...current, ...nextState, isConnecting: false, error: "" }));
      } catch (error) {
        if (!isMounted) return;
        setWallet((current) => ({ ...current, isConnecting: false, error: parseError(error) }));
      }
    }

    async function startWatcher() {
      if (typeof window === "undefined") return;
      try {
        const { WatchWalletChanges } = await import("@stellar/freighter-api");
        if (!isMounted) return;
        watcher = new WatchWalletChanges(3000);
        watcher.watch(() => { syncWallet(); });
      } catch {
        watcher = null;
      }
    }

    syncWallet();
    startWatcher();

    return () => {
      isMounted = false;
      watcher?.stop?.();
    };
  }, []);

  const wrongNetwork =
    Boolean(wallet.networkPassphrase) && wallet.networkPassphrase !== configuredNetworkPassphrase;
  const readyForReads = Boolean(wallet.account) && hasContractConfig() && !wrongNetwork;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", wallet.account, wallet.networkPassphrase],
    queryFn: () => readDashboard(wallet.account),
    enabled: readyForReads
  });

  const sessionsQuery = useQuery({
    queryKey: ["sessions", wallet.account, wallet.networkPassphrase, dashboardQuery.data?.sessionCount || 0],
    queryFn: () => readRecentSessions(wallet.account, 5),
    enabled: readyForReads && Boolean(dashboardQuery.data)
  });

  const badgesQuery = useQuery({
    queryKey: ["badges", wallet.account, wallet.networkPassphrase, dashboardQuery.data?.totalMinutes || 0],
    queryFn: () => readBadges(wallet.account),
    enabled: readyForReads && Boolean(dashboardQuery.data)
  });

  const totalLearnersQuery = useQuery({
    queryKey: ["total-learners", configuredContractId],
    queryFn: () => readTotalLearners(),
    enabled: hasContractConfig(),
    staleTime: 60_000,
    refetchInterval: 120_000
  });

  const liveEventsQuery = useQuery({
    queryKey: ["live-events", configuredContractId],
    queryFn: () => readContractEvents(10),
    enabled: hasContractConfig(),
    staleTime: 10_000,
    refetchInterval: 15_000
  });

  // Extract unique learner addresses from live events for the leaderboard
  const knownLearnerAddresses = useMemo(() => {
    const events = liveEventsQuery.data || [];
    const seen = new Set();
    for (const e of events) {
      if (e.learner) seen.add(e.learner);
    }
    // Always include current user if connected
    if (wallet.account) seen.add(wallet.account);
    return Array.from(seen);
  }, [liveEventsQuery.data, wallet.account]);

  const leaderboardQuery = useQuery({
    queryKey: ["leaderboard", configuredContractId, knownLearnerAddresses.join(",")],
    queryFn: () => readLeaderboard(knownLearnerAddresses),
    enabled: hasContractConfig() && knownLearnerAddresses.length > 0,
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  useEffect(() => {
    if (!dashboardQuery.data) return;
    setGoalForm(String(dashboardQuery.data.weeklyGoalMinutes));
    setProfileForm((current) => ({
      displayName: current.displayName || dashboardQuery.data.displayName,
      weeklyGoalMinutes: current.weeklyGoalMinutes || String(dashboardQuery.data.weeklyGoalMinutes)
    }));
  }, [dashboardQuery.data]);

  const dashboard = dashboardQuery.data;
  const weeklyProgress = useMemo(() => {
    if (!dashboard?.weeklyGoalMinutes) return 0;
    return Math.min(100, Math.round((dashboard.minutesThisWeek / dashboard.weeklyGoalMinutes) * 100));
  }, [dashboard]);

  async function runLedgerAction(action, pendingMessage, successMessage) {
    if (!wallet.account) throw new Error("Connect Freighter before sending a transaction.");
    if (wrongNetwork) throw new Error(`Switch Freighter to ${getNetworkLabel(configuredNetworkPassphrase)}.`);

    setTxState({ status: "pending", message: pendingMessage, hash: "" });

    try {
      const result = await action();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard", wallet.account] }),
        queryClient.invalidateQueries({ queryKey: ["sessions", wallet.account] }),
        queryClient.invalidateQueries({ queryKey: ["badges", wallet.account] }),
        queryClient.invalidateQueries({ queryKey: ["live-events", configuredContractId] }),
        queryClient.invalidateQueries({ queryKey: ["total-learners", configuredContractId] }),
        queryClient.invalidateQueries({ queryKey: ["leaderboard", configuredContractId] })
      ]);

      setTxState({ status: "success", message: successMessage, hash: result.hash });
    } catch (error) {
      setTxState({ status: "error", message: parseError(error), hash: "" });
      throw error;
    }
  }

  const saveProfileMutation = useMutation({
    mutationFn: ({ displayName, weeklyGoalMinutes }) =>
      runLedgerAction(
        () => saveProfile(wallet.account, displayName, weeklyGoalMinutes),
        "Saving your learner profile on Stellar...",
        "Learner profile confirmed."
      )
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ weeklyGoalMinutes }) =>
      runLedgerAction(
        () => updateWeeklyGoal(wallet.account, weeklyGoalMinutes),
        "Updating your study targets...",
        "Study goal updated."
      )
  });

  const logSessionMutation = useMutation({
    mutationFn: ({ topic, minutesSpent }) =>
      runLedgerAction(
        () => logSession(wallet.account, topic, minutesSpent),
        "Submitting your study session...",
        "Study sprint confirmed on-chain."
      )
  });

  const anyMutationPending =
    saveProfileMutation.isPending || updateGoalMutation.isPending || logSessionMutation.isPending;

  async function handleConnectWallet() {
    // Guard: check Freighter is installed before attempting connection
    if (!isFreighterInstalled()) {
      setWallet((current) => ({
        ...current,
        error: "Freighter wallet is not installed. Visit freighter.app to install it."
      }));
      return;
    }

    setWallet((current) => ({ ...current, isConnecting: true, error: "" }));

    try {
      const nextState = await connectWallet();
      setWallet({ ...emptyWallet, ...nextState, isConnecting: false });
      import("posthog-js").then(({ default: posthog }) => {
        posthog.identify(nextState.address || nextState.account);
        posthog.capture("wallet_connected", { account: nextState.address || nextState.account });
      }).catch(() => {});
    } catch (error) {
      setWallet((current) => ({ ...current, isConnecting: false, error: parseError(error) }));
    }
  }

  function handleProfileSubmit(event) {
    event.preventDefault();
    const displayName = profileForm.displayName.trim();
    const weeklyGoalMinutes = Number(profileForm.weeklyGoalMinutes);

    if (!displayName) {
      setProfileError("Add a display name before saving your profile.");
      return;
    }
    if (displayName.length < 3 || displayName.length > 32) {
      setProfileError("Display name must be between 3 and 32 characters.");
      return;
    }
    if (Number.isNaN(weeklyGoalMinutes) || weeklyGoalMinutes < 30 || weeklyGoalMinutes > 5000) {
      setProfileError("Weekly goal must stay between 30 and 5000 minutes.");
      return;
    }

    setProfileError("");
    import("posthog-js").then(({ default: posthog }) => {
      posthog.capture("profile_saved_initiated", { displayName, weeklyGoalMinutes });
    }).catch(() => {});
    saveProfileMutation.mutate({ displayName, weeklyGoalMinutes });
  }

  function handleGoalSubmit(event) {
    event.preventDefault();
    const weeklyGoalMinutes = Number(goalForm);

    if (Number.isNaN(weeklyGoalMinutes) || weeklyGoalMinutes < 30 || weeklyGoalMinutes > 5000) {
      setGoalError("Weekly goal must stay between 30 and 5000 minutes.");
      return;
    }

    setGoalError("");
    import("posthog-js").then(({ default: posthog }) => {
      posthog.capture("goal_updated_initiated", { weeklyGoalMinutes });
    }).catch(() => {});
    updateGoalMutation.mutate({ weeklyGoalMinutes });
  }

  function handleSessionSubmit(event) {
    event.preventDefault();
    const topic = sessionForm.topic.trim();
    const minutesSpent = Number(sessionForm.minutesSpent);

    if (!topic) {
      setSessionError("Give this study sprint a topic so it is meaningful on-chain.");
      return;
    }
    if (topic.length < 3) {
      setSessionError("Topic must be at least 3 characters.");
      return;
    }
    if (/^\s+$/.test(topic)) {
      setSessionError("Topic cannot be whitespace only.");
      return;
    }
    if (Number.isNaN(minutesSpent) || minutesSpent < 5 || minutesSpent > 480) {
      setSessionError("Study sessions must be between 5 and 480 minutes.");
      return;
    }

    setSessionError("");
    import("posthog-js").then(({ default: posthog }) => {
      posthog.capture("study_session_logged_initiated", { topic, minutesSpent });
    }).catch(() => {});
    logSessionMutation.mutate({ topic, minutesSpent });
  }

  const txExplorerLink = getExplorerLink(wallet.networkPassphrase, txState.hash);
  const contractExplorerLink = configuredContractId
    ? `https://stellar.expert/explorer/testnet/contract/${configuredContractId}`
    : "";

  const statusMessage =
    wallet.error ||
    (!isFreighterInstalled() && !wallet.account
      ? "Freighter is not installed yet. Install the extension to sign Soroban transactions from the browser."
      : wrongNetwork
        ? `Connected to ${getNetworkLabel(wallet.networkPassphrase)}. Switch Freighter to ${getNetworkLabel(configuredNetworkPassphrase)}.`
        : txState.message ||
          (hasContractConfig()
            ? "Ready to read, write, and stream study progress on Stellar."
            : "Deploy the Soroban contract and export the frontend config before using the app."));

  return (
    <>
      <nav className="top-nav">
        <div className="top-nav-in">
          <a className="brand" href="#top">
            SkillSprint <span>Ledger</span>
          </a>
          <div className="topbar-actions">
            <span className="network-tag">{getNetworkLabel(configuredNetworkPassphrase)}</span>
            {totalLearnersQuery.data != null && (
              <span className="network-tag" style={{ background: "var(--bg-sand)", color: "var(--ink-muted)" }}>
                {totalLearnersQuery.data} learner{totalLearnersQuery.data !== 1 ? "s" : ""}
              </span>
            )}
            {wallet.account ? (
              <span className="network-tag" style={{ border: '1px solid var(--border)' }}>
                {shortAddress(wallet.account)}
              </span>
            ) : (
              <button
                id="connect-wallet-btn" aria-label="Connect Freighter wallet"
                className="button button-secondary"
                style={{ padding: '0.5rem 1rem' }}
                onClick={handleConnectWallet}
                disabled={wallet.isConnecting}
              >
                {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="app-shell">
        {/* ---------------- DISCONNECTED STATE / LANDING PAGE ---------------- */}
        {!wallet.account && (
          <div className="landing-layout" style={{ display: 'flex', flexDirection: 'column', gap: '4rem', marginTop: '2.5rem' }}>
            {/* Hero Copy */}
            <div className="landing-copy" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <h1 style={{ fontSize: 'clamp(3rem, 6vw, 4.2rem)', lineHeight: '1.1', marginBottom: '1.5rem' }}>
                Proof of Study Secured on <span>Stellar</span>.
              </h1>
              <p className="lead" style={{ fontSize: '1.2rem', marginBottom: '2.5rem', color: 'var(--ink-muted)' }}>
                Turn your learning time into verifiable achievements. Define weekly focus targets, log your learning sessions on-chain, and earn milestone badges verified by Soroban smart contracts.
              </p>
              {wallet.error && (
                <p style={{ color: "#bf4f36", fontSize: "0.9rem", marginBottom: "1rem" }}>{wallet.error}</p>
              )}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button id="hero-connect-btn" className="button button-primary" onClick={handleConnectWallet} disabled={wallet.isConnecting}>
                  {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
                {contractExplorerLink && (
                  <a className="button button-secondary" href={contractExplorerLink} target="_blank" rel="noreferrer">
                    View Deployed Contract
                  </a>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="panel" style={{ background: 'var(--bg-sand)', padding: '2rem 2.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>How it works</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', minHeight: '170px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--ink)', color: '#ffffff', display: 'grid', placeItems: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>01</div>
                    <h3 style={{ fontSize: '1.15rem' }}>Link Wallet</h3>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '0.4rem 0.6rem', background: 'var(--bg-sand)', fontSize: '0.75rem', fontFamily: 'JetBrains Mono', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#bf4f36', display: 'inline-block' }}></span>
                    <span>Linked: G...X4Z9</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.35', color: 'var(--ink-muted)' }}>Connect Freighter extension to securely verify study identity.</p>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', minHeight: '170px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--ink)', color: '#ffffff', display: 'grid', placeItems: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>02</div>
                    <h3 style={{ fontSize: '1.15rem' }}>Log Sprints</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.4rem 0.6rem', background: 'var(--bg-sand)', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '500' }}>
                      <span>Topic: CLI</span>
                      <span style={{ color: '#3b7c70' }}>+45 mins</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.35', color: 'var(--ink-muted)' }}>Input topics and focus minutes logged directly to Stellar ledger.</p>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', minHeight: '170px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--ink)', color: '#ffffff', display: 'grid', placeItems: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>03</div>
                    <h3 style={{ fontSize: '1.15rem' }}>Earn Badges</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.5rem', background: 'var(--bg-sand)', fontSize: '1.2rem' }}>
                    <span>🥉</span>
                    <span>🥈</span>
                    <span>🥇</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.35', color: 'var(--ink-muted)' }}>Pass thresholds to earn milestone badges awarded via ICC.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- CONNECTED STATE / WORKSPACE DASHBOARD ---------------- */}
        {wallet.account && (
          <div className="dashboard-view">
            {statusMessage && (
              <div className="status-banner">
                <span>{statusMessage}</span>
                {txExplorerLink && (
                  <a className="event-link" href={txExplorerLink} target="_blank" rel="noreferrer">
                    Tx details ↗
                  </a>
                )}
              </div>
            )}

            {/* Metrics row */}
            {dashboardQuery.isLoading ? (
              <div className="metrics-row">
                {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="metrics-row">
                <MetricCard
                  label="Hours Invested"
                  value={dashboard ? formatMinutes(dashboard.totalMinutes) : "0m"}
                  note={dashboard ? `${dashboard.sessionCount} logged sessions` : "Starts after your first session"}
                />
                <MetricCard
                  label="Weekly Progress"
                  value={dashboard ? formatMinutes(dashboard.minutesThisWeek) : "0m"}
                  note={
                    dashboard
                      ? `${Math.max(dashboard.weeklyGoalMinutes - dashboard.minutesThisWeek, 0)} minutes to goal`
                      : "Set your target and begin logging"
                  }
                />
                <MetricCard
                  label="Current Streak"
                  value={dashboard ? `${dashboard.currentStreak} day${dashboard.currentStreak === 1 ? "" : "s"}` : "0 days"}
                  note={dashboard?.goalReachedThisWeek ? "Goal reached this week!" : "Keep the streak alive"}
                />
                <MetricCard
                  label="Identity Profile"
                  value={dashboard?.displayName || "Anonymous Learner"}
                  note={shortAddress(wallet.account)}
                />
              </div>
            )}

            <div className="dashboard-grid">
              <div className="main-column">
                <div className="panel">
                  <h2 className="panel-title">Log a Focused Study Sprint</h2>
                  <p className="panel-subtitle">Record your session. Achievements and streaks will update automatically.</p>
                  <form id="log-session-form" className="form-grid" onSubmit={handleSessionSubmit}>
                    <div className="form-field">
                      <span>Topic or Subject</span>
                      <input
                        id="session-topic-input"
                        type="text"
                        placeholder="e.g., Soroban Storage Types"
                        value={sessionForm.topic}
                        onChange={(event) => {
                          setSessionError("");
                          setSessionForm((current) => ({ ...current, topic: event.target.value }));
                        }}
                      />
                    </div>
                    <div className="form-field">
                      <span>Minutes Studied</span>
                      <input
                        id="session-minutes-input"
                        type="number"
                        min="5"
                        max="480"
                        step="5"
                        value={sessionForm.minutesSpent}
                        onChange={(event) => {
                          setSessionError("");
                          setSessionForm((current) => ({ ...current, minutesSpent: event.target.value }));
                        }}
                      />
                    </div>
                    <FormError message={sessionError} />
                    <button id="log-session-btn" className="button button-primary" type="submit" disabled={anyMutationPending}>
                      {logSessionMutation.isPending ? "Logging..." : "Log Sprint"}
                    </button>
                  </form>
                </div>

                <div className="panel">
                  <h2 className="panel-title">On-Chain Badges</h2>
                  <p className="panel-subtitle">Milestone achievements earned on the rewards contract via ICC calls.</p>
                  {badgesQuery.isLoading ? (
                    <SkeletonCard />
                  ) : badgesQuery.data?.length ? (
                    <div className="badge-grid">
                      {badgesQuery.data.map((badgeId) => {
                        const def = badgeDefinitions[badgeId] || { name: `Badge #${badgeId}`, desc: "Milestone unlocked", icon: "🏆" };
                        return (
                          <article className="badge-card" key={badgeId}>
                            <span className="badge-icon">{def.icon}</span>
                            <h3>{def.name}</h3>
                            <p>{def.desc}</p>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem' }}>
                      No badges earned yet. Reach milestones of 60m, 300m, or 1000m total study time to be awarded milestone badges.
                    </p>
                  )}
                </div>

                {/* Analytics Summary */}
                <AnalyticsSummary
                  dashboard={dashboard}
                  badges={badgesQuery.data || []}
                  totalLearners={totalLearnersQuery.data ?? null}
                />
              </div>

              <div className="side-column">
                <div className="panel">
                  <h2 className="panel-title">Configure Profile</h2>
                  <p className="panel-subtitle">Save a public display name and configure weekly targets.</p>
                  <form id="save-profile-form" className="form-grid" onSubmit={handleProfileSubmit}>
                    <div className="form-field">
                      <span>Display Name</span>
                      <input
                        id="display-name-input"
                        type="text"
                        placeholder="e.g., RustPilot"
                        value={profileForm.displayName}
                        onChange={(event) => {
                          setProfileError("");
                          setProfileForm((current) => ({ ...current, displayName: event.target.value }));
                        }}
                      />
                    </div>
                    <div className="form-field">
                      <span>Weekly Goal (Minutes)</span>
                      <input
                        id="weekly-goal-input"
                        type="number"
                        min="30"
                        max="5000"
                        step="5"
                        value={profileForm.weeklyGoalMinutes}
                        onChange={(event) => {
                          setProfileError("");
                          setProfileForm((current) => ({ ...current, weeklyGoalMinutes: event.target.value }));
                        }}
                      />
                    </div>
                    <FormError message={profileError} />
                    <button id="save-profile-btn" className="button button-secondary" type="submit" disabled={anyMutationPending}>
                      {saveProfileMutation.isPending ? "Saving..." : "Save Profile"}
                    </button>
                  </form>
                </div>

                <div className="panel">
                  <h2 className="panel-title">Weekly target progress</h2>
                  <div className="hero-progress">
                    <div className="progress-header">
                      <span>Current Weekly Progress</span>
                      <span>{weeklyProgress}%</span>
                    </div>
                    <div className="progress-track">
                      <span className="progress-fill" style={{ width: `${weeklyProgress}%` }} />
                    </div>
                  </div>
                  <form id="update-goal-form" className="form-grid" onSubmit={handleGoalSubmit}>
                    <div className="form-field">
                      <span>Quick adjust goal (mins)</span>
                      <input
                        id="quick-goal-input"
                        type="number"
                        min="30"
                        max="5000"
                        step="5"
                        value={goalForm}
                        onChange={(event) => {
                          setGoalError("");
                          setGoalForm(event.target.value);
                        }}
                      />
                    </div>
                    <FormError message={goalError} />
                    <button id="update-goal-btn" className="button button-secondary" type="submit" disabled={anyMutationPending}>
                      {updateGoalMutation.isPending ? "Updating..." : "Update Target"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="panel" style={{ marginTop: '2.5rem' }}>
              <h2 className="panel-title">Recent Study Sessions</h2>
              <p className="panel-subtitle">Latest study sessions logged on-chain.</p>
              {sessionsQuery.isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : sessionsQuery.data?.length ? (
                <div className="session-list">
                  {sessionsQuery.data.map((session) => (
                    <article className="session-card" key={session.id}>
                      <div>
                        <div className="session-topic">{session.topic}</div>
                        <div className="session-time">{formatDate(session.timestamp)}</div>
                      </div>
                      <div className="session-stats">
                        <span>{formatMinutes(session.minutesSpent)}</span>
                        <span className="network-tag" style={{ background: 'var(--bg-sand)' }}>
                          Streak {session.streakAfterLog}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--ink-muted)' }}>No logged sessions found.</p>
              )}
            </div>

            {/* Community Leaderboard */}
            <LeaderboardPanel
              entries={leaderboardQuery.data || []}
              isLoading={leaderboardQuery.isLoading}
              currentAccount={wallet.account}
            />
          </div>
        )}

        {/* ---------------- EVENT STREAM ---------------- */}
        <div className="panel" style={{ marginTop: '3rem' }}>
          <h2 className="panel-title">Live Blockchain Activity</h2>
          <p className="panel-subtitle">Near real-time events polled directly from the Stellar Soroban RPC interface.</p>
          {liveEventsQuery.data?.length ? (
            <div className="event-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {liveEventsQuery.data.map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem' }}>No recent contract events polled.</p>
          )}
        </div>
      </div>
    </>
  );
}
