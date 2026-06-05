export const skillSprintConfig = {
  "contractName": "SkillSprintLedger",
  "fallbackAddress": "",
  "fallbackChainId": 31337,
  "generatedAt": "2026-04-19T08:02:24.780Z",
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "learner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "displayName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "weeklyGoalMinutes",
          "type": "uint32"
        }
      ],
      "name": "ProfileSaved",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "learner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "topic",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "minutesSpent",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "minutesThisWeek",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "uint16",
          "name": "currentStreak",
          "type": "uint16"
        }
      ],
      "name": "StudySessionLogged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "learner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "weeklyGoalMinutes",
          "type": "uint32"
        }
      ],
      "name": "WeeklyGoalUpdated",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "MAX_GOAL_MINUTES",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAX_SESSION_MINUTES",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MIN_GOAL_MINUTES",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MIN_SESSION_MINUTES",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "learner",
          "type": "address"
        }
      ],
      "name": "getDashboard",
      "outputs": [
        {
          "internalType": "string",
          "name": "displayName",
          "type": "string"
        },
        {
          "internalType": "uint32",
          "name": "weeklyGoalMinutes",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "totalMinutes",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "minutesThisWeek",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "sessionCount",
          "type": "uint32"
        },
        {
          "internalType": "uint16",
          "name": "currentStreak",
          "type": "uint16"
        },
        {
          "internalType": "uint64",
          "name": "createdAt",
          "type": "uint64"
        },
        {
          "internalType": "bool",
          "name": "goalReachedThisWeek",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "learner",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "getSession",
      "outputs": [
        {
          "internalType": "string",
          "name": "topic",
          "type": "string"
        },
        {
          "internalType": "uint32",
          "name": "minutesSpent",
          "type": "uint32"
        },
        {
          "internalType": "uint64",
          "name": "timestamp",
          "type": "uint64"
        },
        {
          "internalType": "uint16",
          "name": "streakAfterLog",
          "type": "uint16"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "learner",
          "type": "address"
        }
      ],
      "name": "getSessionCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "learner",
          "type": "address"
        }
      ],
      "name": "hasProfile",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "topic",
          "type": "string"
        },
        {
          "internalType": "uint32",
          "name": "minutesSpent",
          "type": "uint32"
        }
      ],
      "name": "logSession",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "displayName",
          "type": "string"
        },
        {
          "internalType": "uint32",
          "name": "weeklyGoalMinutes",
          "type": "uint32"
        }
      ],
      "name": "saveProfile",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint32",
          "name": "newGoalMinutes",
          "type": "uint32"
        }
      ],
      "name": "updateWeeklyGoal",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};
