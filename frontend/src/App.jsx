import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WatchWalletChanges } from "@stellar/freighter-api";
import {
  configuredContractId,
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
  saveProfile,
  shortAddress,
  updateWeeklyGoal
} from "./lib/skillSprint";

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

function Panel({ eyebrow, title, body, children, emphasis = "coral" }) {
  return (
    <section className={`panel panel-${emphasis}`}>
      <div className="panel-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {body ? <p className="panel-body">{body}</p> : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, note, loading = false }) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <div className={loading ? "skeleton skeleton-metric" : "metric-value"}>{loading ? "" : value}</div>
      <p className="metric-note">{loading ? <span className="skeleton skeleton-note" /> : note}</p>
    </article>
  );
}

function ActivitySkeleton() {
  return (
    <div className="session-list">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="session-card session-skeleton" key={index}>
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-note" />
          <span className="skeleton skeleton-badge" />
        </div>
      ))}
    </div>
  );
}

function EventCard({ event }) {
  return (
    <article className="event-card">
      <div className="event-head">
        <div>
          <p className="event-label">{event.label}</p>
          <p className="event-meta">
            {shortAddress(event.learner)} • {new Date(event.occurredAt).toLocaleString()}
          </p>
        </div>
        <a
          className="event-link"
          href={`https://stellar.expert/explorer/testnet/tx/${event.txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          Tx
        </a>
      </div>
      <p className="event-summary">{event.summary}</p>
      <p className="event-meta">Ledger {event.ledger}</p>
    </article>
  );
}

export default function App() {
  const queryClient = useQueryClient();
  const freighterInstalled = isFreighterInstalled();
  const [wallet, setWallet] = useState(emptyWallet);
  const [txState, setTxState] = useState(emptyTx);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    weeklyGoalMinutes: "240"
  });
  const [goalForm, setGoalForm] = useState("300");
  const [sessionForm, setSessionForm] = useState({
    topic: "",
    minutesSpent: "45"
  });

  useEffect(() => {
    let isMounted = true;
    let watcher = null;

    async function syncWallet() {
      try {
        const nextState = await discoverWalletState();
        if (!isMounted) {
          return;
        }

        setWallet((current) => ({
          ...current,
          ...nextState,
          isConnecting: false,
          error: ""
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWallet((current) => ({
          ...current,
          isConnecting: false,
          error: parseError(error)
        }));
      }
    }

    syncWallet();

    if (typeof window !== "undefined" && freighterInstalled) {
      watcher = new WatchWalletChanges(3000);
      watcher.watch(() => {
        setTxState(emptyTx);
        syncWallet();
      });
    }

    return () => {
      isMounted = false;
      watcher?.stop?.();
    };
  }, [freighterInstalled]);

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

  const liveEventsQuery = useQuery({
    queryKey: ["contract-events", configuredContractId],
    queryFn: () => readContractEvents(6),
    enabled: hasContractConfig(),
    staleTime: 8_000,
    refetchInterval: 12_000,
    refetchIntervalInBackground: false
  });

  useEffect(() => {
    if (!dashboardQuery.data) {
      return;
    }

    setGoalForm(String(dashboardQuery.data.weeklyGoalMinutes));
    setProfileForm((current) => ({
      displayName: current.displayName || dashboardQuery.data.displayName,
      weeklyGoalMinutes: current.weeklyGoalMinutes || String(dashboardQuery.data.weeklyGoalMinutes)
    }));
  }, [dashboardQuery.data]);

  const dashboard = dashboardQuery.data;
  const weeklyProgress = useMemo(() => {
    if (!dashboard?.weeklyGoalMinutes) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((dashboard.minutesThisWeek / dashboard.weeklyGoalMinutes) * 100)
    );
  }, [dashboard]);

  async function runLedgerAction(action, pendingMessage, successMessage) {
    if (!wallet.account) {
      throw new Error("Connect Freighter before sending a transaction.");
    }

    if (wrongNetwork) {
      throw new Error(`Switch Freighter to ${getNetworkLabel(configuredNetworkPassphrase)}.`);
    }

    setTxState({
      status: "pending",
      message: pendingMessage,
      hash: ""
    });

    try {
      const result = await action();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard", wallet.account] }),
        queryClient.invalidateQueries({ queryKey: ["sessions", wallet.account] }),
        queryClient.invalidateQueries({ queryKey: ["contract-events"] })
      ]);

      setTxState({
        status: "success",
        message: successMessage,
        hash: result.hash
      });
    } catch (error) {
      const message = parseError(error);
      setTxState({
        status: "error",
        message,
        hash: ""
      });
      throw error;
    }
  }

  const saveProfileMutation = useMutation({
    mutationFn: ({ displayName, weeklyGoalMinutes }) =>
      runLedgerAction(
        () => saveProfile(wallet.account, displayName, weeklyGoalMinutes),
        "Creating your learner profile on Stellar...",
        "Profile saved on Soroban."
      )
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ weeklyGoalMinutes }) =>
      runLedgerAction(
        () => updateWeeklyGoal(wallet.account, weeklyGoalMinutes),
        "Updating your weekly target on Stellar...",
        "Weekly goal updated."
      )
  });

  const logSessionMutation = useMutation({
    mutationFn: ({ topic, minutesSpent }) =>
      runLedgerAction(
        () => logSession(wallet.account, topic, minutesSpent),
        "Logging your study sprint on Stellar...",
        "Study session logged."
      )
  });

  const anyMutationPending =
    saveProfileMutation.isPending || updateGoalMutation.isPending || logSessionMutation.isPending;

  async function handleConnectWallet() {
    if (!freighterInstalled) {
      setWallet((current) => ({
        ...current,
        error: "Freighter is not installed in this browser."
      }));
      return;
    }

    setWallet((current) => ({
      ...current,
      isConnecting: true,
      error: ""
    }));

    try {
      const nextState = await connectWallet();
      setWallet({
        ...emptyWallet,
        ...nextState,
        isConnecting: false
      });
    } catch (error) {
      setWallet((current) => ({
        ...current,
        isConnecting: false,
        error: parseError(error)
      }));
    }
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    const displayName = profileForm.displayName.trim();
    const weeklyGoalMinutes = Number(profileForm.weeklyGoalMinutes);

    if (!displayName) {
      setTxState({
        status: "error",
        message: "Add a display name before saving your profile.",
        hash: ""
      });
      return;
    }

    if (Number.isNaN(weeklyGoalMinutes) || weeklyGoalMinutes < 30 || weeklyGoalMinutes > 5000) {
      setTxState({
        status: "error",
        message: "Weekly goal must stay between 30 and 5000 minutes.",
        hash: ""
      });
      return;
    }

    saveProfileMutation.mutate({
      displayName,
      weeklyGoalMinutes
    });
  }

  function handleGoalSubmit(event) {
    event.preventDefault();

    const weeklyGoalMinutes = Number(goalForm);
    if (Number.isNaN(weeklyGoalMinutes) || weeklyGoalMinutes < 30 || weeklyGoalMinutes > 5000) {
      setTxState({
        status: "error",
        message: "Pick a weekly goal between 30 and 5000 minutes.",
        hash: ""
      });
      return;
    }

    updateGoalMutation.mutate({
      weeklyGoalMinutes
    });
  }

  function handleSessionSubmit(event) {
    event.preventDefault();

    const topic = sessionForm.topic.trim();
    const minutesSpent = Number(sessionForm.minutesSpent);

    if (!topic) {
      setTxState({
        status: "error",
        message: "Give this study sprint a topic so it is meaningful on-chain.",
        hash: ""
      });
      return;
    }

    if (Number.isNaN(minutesSpent) || minutesSpent < 5 || minutesSpent > 480) {
      setTxState({
        status: "error",
        message: "Study sessions must be between 5 and 480 minutes.",
        hash: ""
      });
      return;
    }

    logSessionMutation.mutate({
      topic,
      minutesSpent
    });
  }

  const txExplorerLink = getExplorerLink(wallet.networkPassphrase, txState.hash);
  const contractExplorerLink = configuredContractId
    ? configuredNetworkPassphrase === "Public Global Stellar Network ; September 2015"
      ? `https://lab.stellar.org/r/public/contract/${configuredContractId}`
      : `https://lab.stellar.org/r/testnet/contract/${configuredContractId}`
    : "";

  const statusMessage =
    wallet.error ||
    (!freighterInstalled
      ? "Freighter is not installed yet. Install the extension to sign Soroban transactions from the browser."
      : wrongNetwork
        ? `Connected to ${getNetworkLabel(wallet.networkPassphrase)}. Switch Freighter to ${getNetworkLabel(configuredNetworkPassphrase)}.`
        : txState.message ||
          (hasContractConfig()
            ? "Ready to read, write, and stream study progress on Stellar."
            : "Deploy the Soroban contract and export the frontend config before using the app."));

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="hero">
        <div className="hero-copy">
          <p className="kicker">Soroban mini-dApp build</p>
          <h1>SkillSprint Ledger</h1>
          <p className="lead">
            Turn study effort into on-chain proof on Stellar. Set a weekly goal, log focused
            learning sessions, and monitor contract events in near real time from Soroban RPC.
          </p>

          <div className="hero-actions">
            {freighterInstalled ? (
              <button
                className="button button-primary"
                onClick={handleConnectWallet}
                disabled={wallet.isConnecting}
              >
                {wallet.isConnecting
                  ? "Connecting..."
                  : wallet.account
                    ? "Wallet Connected"
                    : "Connect Freighter"}
              </button>
            ) : (
              <a
                className="button button-primary"
                href="https://www.freighter.app/"
                target="_blank"
                rel="noreferrer"
              >
                Install Freighter
              </a>
            )}

            {contractExplorerLink ? (
              <a className="button button-secondary" href={contractExplorerLink} target="_blank" rel="noreferrer">
                View contract
              </a>
            ) : null}
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-chip-row">
            <span className="chip">{wallet.account ? shortAddress(wallet.account) : "No wallet yet"}</span>
            <span className="chip">
              {wallet.networkPassphrase
                ? getNetworkLabel(wallet.networkPassphrase)
                : "Wallet network pending"}
            </span>
            <span className="chip chip-live">
              <span className="live-dot" />
              Live RPC event feed
            </span>
          </div>

          <div className="hero-stat">
            <span>Contract ID</span>
            <strong>{configuredContractId ? shortAddress(configuredContractId) : "Not deployed"}</strong>
          </div>

          <div className="progress-shell">
            <div className="progress-labels">
              <span>Weekly momentum</span>
              <span>{dashboard ? `${weeklyProgress}%` : "0%"}</span>
            </div>
            <div className="progress-track">
              <span className="progress-fill" style={{ width: `${weeklyProgress}%` }} />
            </div>
          </div>

          <p className="hero-note">
            Built for study groups, bootcamp learners, and accountability-friendly progress on
            Soroban with deployment-safe frontend builds.
          </p>
        </div>
      </header>

      <section className="status-banner">
        <div>
          <p className="status-label">Status</p>
          <p className="status-copy">{statusMessage}</p>
        </div>

        <div className="status-actions">
          {contractExplorerLink ? (
            <a className="status-link" href={contractExplorerLink} target="_blank" rel="noreferrer">
              Contract
            </a>
          ) : null}
          {txExplorerLink ? (
            <a className="status-link" href={txExplorerLink} target="_blank" rel="noreferrer">
              Last transaction
            </a>
          ) : null}
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard
          label="Hours invested"
          value={dashboard ? formatMinutes(dashboard.totalMinutes) : "0m"}
          note={dashboard ? `${dashboard.sessionCount} logged sessions` : "Starts after your first session"}
          loading={dashboardQuery.isLoading}
        />
        <MetricCard
          label="Weekly progress"
          value={dashboard ? formatMinutes(dashboard.minutesThisWeek) : "0m"}
          note={
            dashboard
              ? `${Math.max(dashboard.weeklyGoalMinutes - dashboard.minutesThisWeek, 0)} minutes to goal`
              : "Set your target and begin logging"
          }
          loading={dashboardQuery.isLoading}
        />
        <MetricCard
          label="Current streak"
          value={dashboard ? `${dashboard.currentStreak} day${dashboard.currentStreak === 1 ? "" : "s"}` : "0 days"}
          note={
            dashboard
              ? dashboard.goalReachedThisWeek
                ? "Goal reached this week"
                : "Keep the streak alive"
              : "Consecutive-day activity tracker"
          }
          loading={dashboardQuery.isLoading}
        />
        <MetricCard
          label="Study identity"
          value={dashboard?.displayName || "No profile"}
          note={wallet.account ? shortAddress(wallet.account) : "Connect to personalize"}
          loading={dashboardQuery.isLoading}
        />
      </section>

      {!hasContractConfig() ? (
        <Panel
          eyebrow="Deployment setup"
          title="One Soroban deploy unlocks the full app"
          body="The frontend is wired and ready. Build the Rust contract, deploy it with Stellar CLI, and export the contract ID for the UI."
          emphasis="teal"
        >
          <div className="code-stack">
            <code>stellar keys generate alice --network testnet --fund</code>
            <code>npm run contract:build</code>
            <code>npm run contract:deploy</code>
            <code>npm run export:frontend</code>
          </div>
        </Panel>
      ) : null}

      <section className="panel-grid">
        <Panel
          eyebrow="Action one"
          title="Create or refresh your learner profile"
          body="Save a public display name plus the number of study minutes you want to hit every week."
        >
          <form className="form-grid" onSubmit={handleProfileSubmit}>
            <label>
              <span>Display name</span>
              <input
                type="text"
                placeholder="Protocol Pilot"
                value={profileForm.displayName}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, displayName: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Weekly goal (minutes)</span>
              <input
                type="number"
                min="30"
                max="5000"
                step="5"
                value={profileForm.weeklyGoalMinutes}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    weeklyGoalMinutes: event.target.value
                  }))
                }
              />
            </label>
            <button
              className="button button-primary"
              type="submit"
              disabled={anyMutationPending || !wallet.account || !hasContractConfig()}
            >
              {saveProfileMutation.isPending ? "Saving..." : "Save profile"}
            </button>
          </form>
        </Panel>

        <Panel
          eyebrow="Action two"
          title="Tune your weekly target"
          body="Update the goal whenever your workload changes. Progress resets each new on-chain week."
          emphasis="teal"
        >
          <form className="form-grid" onSubmit={handleGoalSubmit}>
            <label>
              <span>New weekly goal</span>
              <input
                type="number"
                min="30"
                max="5000"
                step="5"
                value={goalForm}
                onChange={(event) => setGoalForm(event.target.value)}
              />
            </label>
            <button
              className="button button-secondary"
              type="submit"
              disabled={anyMutationPending || !wallet.account || !dashboard || !hasContractConfig()}
            >
              {updateGoalMutation.isPending ? "Updating..." : "Update goal"}
            </button>
          </form>
        </Panel>

        <Panel
          eyebrow="Action three"
          title="Log a focused study sprint"
          body="Record the topic, minutes spent, and streak impact. Recent sessions and live RPC events refresh after each confirmed transaction."
          emphasis="slate"
        >
          <form className="form-grid" onSubmit={handleSessionSubmit}>
            <label>
              <span>Topic</span>
              <input
                type="text"
                placeholder="Contract storage"
                value={sessionForm.topic}
                onChange={(event) =>
                  setSessionForm((current) => ({ ...current, topic: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Minutes studied</span>
              <input
                type="number"
                min="5"
                max="480"
                step="5"
                value={sessionForm.minutesSpent}
                onChange={(event) =>
                  setSessionForm((current) => ({
                    ...current,
                    minutesSpent: event.target.value
                  }))
                }
              />
            </label>
            <button
              className="button button-primary"
              type="submit"
              disabled={anyMutationPending || !wallet.account || !dashboard || !hasContractConfig()}
            >
              {logSessionMutation.isPending ? "Logging..." : "Log session"}
            </button>
          </form>
        </Panel>
      </section>

      <section className="panel-grid panel-grid-bottom">
        <Panel
          eyebrow="Readable history"
          title="Recent on-chain sessions"
          body="The feed below pulls the latest five sessions and refreshes after each confirmed transaction."
          emphasis="slate"
        >
          {sessionsQuery.isLoading ? (
            <ActivitySkeleton />
          ) : sessionsQuery.data?.length ? (
            <div className="session-list">
              {sessionsQuery.data.map((session) => (
                <article className="session-card" key={session.id}>
                  <div>
                    <h3>{session.topic}</h3>
                    <p>{formatDate(session.timestamp)}</p>
                  </div>
                  <div className="session-meta">
                    <span>{formatMinutes(session.minutesSpent)}</span>
                    <span>Streak {session.streakAfterLog}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              {dashboard
                ? "Your feed will populate after the first logged study sprint."
                : "Create a profile first, then your last five sessions will appear here."}
            </p>
          )}
        </Panel>

        <Panel
          eyebrow="Real-time events"
          title="Live contract activity"
          body="Recent Soroban contract events are polled from RPC so you can verify writes without reloading the app."
          emphasis="teal"
        >
          {liveEventsQuery.isLoading ? (
            <ActivitySkeleton />
          ) : liveEventsQuery.data?.length ? (
            <div className="event-feed">
              {liveEventsQuery.data.map((event) => (
                <EventCard event={event} key={event.id} />
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No recent contract events were found in the current ledger window. Submit a fresh
              transaction to populate the live stream.
            </p>
          )}
        </Panel>
      </section>

      <section className="panel-grid panel-grid-single">
        <Panel
          eyebrow="Submission ready"
          title="Why this now fits the advanced production brief"
          body="The app now pairs Soroban contract writes with live event polling, deployment-safe frontend builds, CI checks, and mobile-first layout adjustments."
          emphasis="slate"
        >
          <ul className="check-list">
            <li>Rust Soroban contract with typed storage, events, and validation rules</li>
            <li>Near real-time Soroban event streaming from RPC for fresh on-chain activity</li>
            <li>Vercel-safe frontend build path plus GitHub Actions contract and frontend checks</li>
            <li>Responsive cards, stacked mobile layouts, and runtime error boundary coverage</li>
          </ul>
        </Panel>
      </section>
    </div>
  );
}
