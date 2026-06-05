import { ethers } from "ethers";
import { skillSprintConfig } from "./contract-config";

const chainLabels = {
  31337: "Hardhat Local",
  11155111: "Sepolia"
};

function getInjectedEthereum() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.ethereum;
}

export const configuredContractAddress =
  import.meta.env.VITE_CONTRACT_ADDRESS || skillSprintConfig.fallbackAddress || "";
export const configuredChainId = Number(
  import.meta.env.VITE_CHAIN_ID || skillSprintConfig.fallbackChainId || 0
);
export const configuredRpcUrl = import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

export function hasContractConfig() {
  return Boolean(
    configuredContractAddress &&
      configuredContractAddress !== ethers.ZeroAddress &&
      skillSprintConfig.abi.length
  );
}

export function getChainLabel(chainId) {
  return chainLabels[chainId] || `Chain ${chainId || "Unknown"}`;
}

export function shortAddress(value = "") {
  if (!value) {
    return "Not connected";
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function formatMinutes(totalMinutes) {
  const minutes = Number(totalMinutes || 0);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!hours) {
    return `${minutes}m`;
  }

  if (!remainder) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

export function formatDate(unixSeconds) {
  if (!unixSeconds) {
    return "No sessions logged yet";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(Number(unixSeconds) * 1000));
}

export function getExplorerLink(chainId, hash) {
  if (!hash) {
    return "";
  }

  if (chainId === 11155111) {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  }

  return "";
}

export function parseError(error) {
  const possibleMessages = [
    error?.shortMessage,
    error?.reason,
    error?.info?.error?.message,
    error?.data?.message,
    error?.message
  ].filter(Boolean);

  const message = possibleMessages[0] || "Something unexpected happened.";
  return message.replace("execution reverted: ", "");
}

async function buildBrowserProvider() {
  const ethereum = getInjectedEthereum();
  if (!ethereum) {
    throw new Error("MetaMask is required to continue.");
  }

  return new ethers.BrowserProvider(ethereum);
}

function createContract(connection) {
  if (!hasContractConfig()) {
    throw new Error(
      "No contract address is configured yet. Deploy locally with `npm run deploy:local`, then run `npm run export:abi`."
    );
  }

  return new ethers.Contract(configuredContractAddress, skillSprintConfig.abi, connection);
}

export async function discoverWalletState() {
  const ethereum = getInjectedEthereum();
  if (!ethereum) {
    return {
      provider: null,
      account: "",
      chainId: 0
    };
  }

  const accounts = await ethereum.request({ method: "eth_accounts" });
  if (!accounts.length) {
    return {
      provider: null,
      account: "",
      chainId: 0
    };
  }

  const provider = await buildBrowserProvider();
  const network = await provider.getNetwork();

  return {
    provider,
    account: ethers.getAddress(accounts[0]),
    chainId: Number(network.chainId)
  };
}

export async function connectWallet() {
  const provider = await buildBrowserProvider();
  const accounts = await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();

  return {
    provider,
    account: ethers.getAddress(accounts[0]),
    chainId: Number(network.chainId)
  };
}

export async function switchToSkillSprintChain() {
  const ethereum = getInjectedEthereum();
  if (!ethereum || !configuredChainId) {
    return;
  }

  const requestedChainId = `0x${configuredChainId.toString(16)}`;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: requestedChainId }]
    });
  } catch (error) {
    if (error?.code === 4902 && configuredChainId === 31337) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: requestedChainId,
            chainName: "Hardhat Local",
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18
            },
            rpcUrls: [configuredRpcUrl]
          }
        ]
      });
      return;
    }

    throw error;
  }
}

export async function readDashboard(provider, account) {
  const contract = createContract(provider);
  const exists = await contract.hasProfile(account);

  if (!exists) {
    return null;
  }

  const dashboard = await contract.getDashboard(account);
  return {
    displayName: dashboard.displayName,
    weeklyGoalMinutes: Number(dashboard.weeklyGoalMinutes),
    totalMinutes: Number(dashboard.totalMinutes),
    minutesThisWeek: Number(dashboard.minutesThisWeek),
    sessionCount: Number(dashboard.sessionCount),
    currentStreak: Number(dashboard.currentStreak),
    createdAt: Number(dashboard.createdAt),
    goalReachedThisWeek: Boolean(dashboard.goalReachedThisWeek)
  };
}

export async function readRecentSessions(provider, account, limit = 5) {
  const contract = createContract(provider);
  const count = Number(await contract.getSessionCount(account));

  if (!count) {
    return [];
  }

  const indexes = Array.from({ length: Math.min(count, limit) }, (_, idx) => count - idx - 1);
  const sessions = await Promise.all(indexes.map((index) => contract.getSession(account, index)));

  return sessions.map((session, idx) => ({
    id: `${indexes[idx]}-${session.timestamp}`,
    topic: session.topic,
    minutesSpent: Number(session.minutesSpent),
    timestamp: Number(session.timestamp),
    streakAfterLog: Number(session.streakAfterLog)
  }));
}

async function buildSignerContract(provider, account) {
  const signer = await provider.getSigner(account);
  return createContract(signer);
}

export async function saveProfile(provider, account, displayName, weeklyGoalMinutes) {
  const contract = await buildSignerContract(provider, account);
  return contract.saveProfile(displayName, Number(weeklyGoalMinutes));
}

export async function updateWeeklyGoal(provider, account, weeklyGoalMinutes) {
  const contract = await buildSignerContract(provider, account);
  return contract.updateWeeklyGoal(Number(weeklyGoalMinutes));
}

export async function logSession(provider, account, topic, minutesSpent) {
  const contract = await buildSignerContract(provider, account);
  return contract.logSession(topic, Number(minutesSpent));
}
