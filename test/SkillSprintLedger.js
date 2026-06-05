const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkillSprintLedger", function () {
  async function deployFixture() {
    const [owner, learner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("SkillSprintLedger");
    const ledger = await factory.deploy();
    await ledger.waitForDeployment();

    return { owner, learner, ledger };
  }

  it("deploys with the expected study constraints", async function () {
    const { ledger } = await loadFixture(deployFixture);

    expect(await ledger.MIN_SESSION_MINUTES()).to.equal(5);
    expect(await ledger.MAX_SESSION_MINUTES()).to.equal(480);
    expect(await ledger.MIN_GOAL_MINUTES()).to.equal(30);
  });

  it("creates a learner profile and exposes dashboard data", async function () {
    const { learner, ledger } = await loadFixture(deployFixture);

    await expect(ledger.connect(learner).saveProfile("Deep Builder", 360))
      .to.emit(ledger, "ProfileSaved")
      .withArgs(learner.address, "Deep Builder", 360);

    const dashboard = await ledger.getDashboard(learner.address);

    expect(dashboard.displayName).to.equal("Deep Builder");
    expect(dashboard.weeklyGoalMinutes).to.equal(360);
    expect(dashboard.totalMinutes).to.equal(0);
    expect(dashboard.goalReachedThisWeek).to.equal(false);
  });

  it("logs study sessions, stores history, and grows the streak across days", async function () {
    const { learner, ledger } = await loadFixture(deployFixture);

    await ledger.connect(learner).saveProfile("Protocol Pilot", 300);
    await ledger.connect(learner).logSession("Solidity Loops", 90);

    await time.increase(24 * 60 * 60 + 90);
    await ledger.connect(learner).logSession("ABI Deep Dive", 45);

    const dashboard = await ledger.getDashboard(learner.address);
    const sessionCount = await ledger.getSessionCount(learner.address);
    const newestSession = await ledger.getSession(learner.address, 1);

    expect(dashboard.totalMinutes).to.equal(135);
    expect(dashboard.minutesThisWeek).to.equal(135);
    expect(dashboard.sessionCount).to.equal(2);
    expect(dashboard.currentStreak).to.equal(2);
    expect(sessionCount).to.equal(2);
    expect(newestSession.topic).to.equal("ABI Deep Dive");
    expect(newestSession.minutesSpent).to.equal(45);
  });

  it("resets weekly progress after a full week boundary", async function () {
    const { learner, ledger } = await loadFixture(deployFixture);

    await ledger.connect(learner).saveProfile("Weekly Runner", 240);
    await ledger.connect(learner).logSession("Foundry Review", 120);

    await time.increase(8 * 24 * 60 * 60);

    const dashboard = await ledger.getDashboard(learner.address);
    expect(dashboard.minutesThisWeek).to.equal(0);
    expect(dashboard.totalMinutes).to.equal(120);
  });

  it("rejects invalid actions and missing profiles", async function () {
    const { learner, ledger } = await loadFixture(deployFixture);

    await expect(ledger.connect(learner).logSession("No Profile Yet", 60)).to.be.revertedWith(
      "Profile not found"
    );

    await expect(ledger.connect(learner).saveProfile("AB", 200)).to.be.revertedWith(
      "Display name must be 3-32 chars"
    );

    await ledger.connect(learner).saveProfile("Focus Friend", 200);

    await expect(ledger.connect(learner).logSession("Edge", 4)).to.be.revertedWith(
      "Session minutes out of range"
    );
    await expect(ledger.connect(learner).updateWeeklyGoal(20)).to.be.revertedWith(
      "Weekly goal out of range"
    );
  });
});
