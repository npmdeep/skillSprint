// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SkillSprintLedger {
    uint32 public constant MIN_SESSION_MINUTES = 5;
    uint32 public constant MAX_SESSION_MINUTES = 480;
    uint32 public constant MIN_GOAL_MINUTES = 30;
    uint32 public constant MAX_GOAL_MINUTES = 5000;

    uint256 private constant DAY_IN_SECONDS = 1 days;
    uint256 private constant WEEK_IN_SECONDS = 7 days;

    struct LearnerProfile {
        string displayName;
        uint64 createdAt;
        uint64 lastStudyDay;
        uint64 activeWeek;
        uint32 weeklyGoalMinutes;
        uint32 totalMinutes;
        uint32 minutesThisWeek;
        uint32 sessionCount;
        uint16 currentStreak;
        bool exists;
    }

    struct StudySession {
        string topic;
        uint32 minutesSpent;
        uint64 timestamp;
        uint16 streakAfterLog;
    }

    mapping(address learner => LearnerProfile profile) private profiles;
    mapping(address learner => StudySession[] sessions) private sessionHistory;

    event ProfileSaved(address indexed learner, string displayName, uint32 weeklyGoalMinutes);
    event WeeklyGoalUpdated(address indexed learner, uint32 weeklyGoalMinutes);
    event StudySessionLogged(
        address indexed learner,
        string topic,
        uint32 minutesSpent,
        uint32 minutesThisWeek,
        uint16 currentStreak
    );

    modifier onlyExistingProfile() {
        require(profiles[msg.sender].exists, "Profile not found");
        _;
    }

    function saveProfile(string calldata displayName, uint32 weeklyGoalMinutes) external {
        _validateDisplayName(displayName);
        _validateWeeklyGoal(weeklyGoalMinutes);

        LearnerProfile storage profile = profiles[msg.sender];
        uint64 currentWeek = _currentWeek();

        if (!profile.exists) {
            profile.exists = true;
            profile.createdAt = uint64(block.timestamp);
            profile.activeWeek = currentWeek;
        } else {
            _syncWeek(profile, currentWeek);
        }

        profile.displayName = displayName;
        profile.weeklyGoalMinutes = weeklyGoalMinutes;

        emit ProfileSaved(msg.sender, displayName, weeklyGoalMinutes);
    }

    function updateWeeklyGoal(uint32 newGoalMinutes) external onlyExistingProfile {
        _validateWeeklyGoal(newGoalMinutes);

        LearnerProfile storage profile = profiles[msg.sender];
        _syncWeek(profile, _currentWeek());
        profile.weeklyGoalMinutes = newGoalMinutes;

        emit WeeklyGoalUpdated(msg.sender, newGoalMinutes);
    }

    function logSession(string calldata topic, uint32 minutesSpent) external onlyExistingProfile {
        _validateTopic(topic);
        _validateSessionMinutes(minutesSpent);

        LearnerProfile storage profile = profiles[msg.sender];
        _syncWeek(profile, _currentWeek());

        uint64 currentDay = _currentDay();
        if (profile.sessionCount == 0) {
            profile.currentStreak = 1;
        } else if (currentDay == profile.lastStudyDay) {
            // Keep the current streak for multiple sessions on the same day.
        } else if (currentDay == profile.lastStudyDay + 1) {
            profile.currentStreak += 1;
        } else {
            profile.currentStreak = 1;
        }

        profile.lastStudyDay = currentDay;
        profile.totalMinutes += minutesSpent;
        profile.minutesThisWeek += minutesSpent;
        profile.sessionCount += 1;

        sessionHistory[msg.sender].push(
            StudySession({
                topic: topic,
                minutesSpent: minutesSpent,
                timestamp: uint64(block.timestamp),
                streakAfterLog: profile.currentStreak
            })
        );

        emit StudySessionLogged(
            msg.sender,
            topic,
            minutesSpent,
            profile.minutesThisWeek,
            profile.currentStreak
        );
    }

    function hasProfile(address learner) external view returns (bool) {
        return profiles[learner].exists;
    }

    function getDashboard(
        address learner
    )
        external
        view
        returns (
            string memory displayName,
            uint32 weeklyGoalMinutes,
            uint32 totalMinutes,
            uint32 minutesThisWeek,
            uint32 sessionCount,
            uint16 currentStreak,
            uint64 createdAt,
            bool goalReachedThisWeek
        )
    {
        LearnerProfile memory profile = profiles[learner];
        require(profile.exists, "Profile not found");

        if (uint64(block.timestamp / WEEK_IN_SECONDS) > profile.activeWeek) {
            profile.minutesThisWeek = 0;
        }

        return (
            profile.displayName,
            profile.weeklyGoalMinutes,
            profile.totalMinutes,
            profile.minutesThisWeek,
            profile.sessionCount,
            profile.currentStreak,
            profile.createdAt,
            profile.minutesThisWeek >= profile.weeklyGoalMinutes
        );
    }

    function getSessionCount(address learner) external view returns (uint256) {
        return sessionHistory[learner].length;
    }

    function getSession(
        address learner,
        uint256 index
    )
        external
        view
        returns (
            string memory topic,
            uint32 minutesSpent,
            uint64 timestamp,
            uint16 streakAfterLog
        )
    {
        require(index < sessionHistory[learner].length, "Session index out of bounds");

        StudySession memory session = sessionHistory[learner][index];
        return (session.topic, session.minutesSpent, session.timestamp, session.streakAfterLog);
    }

    function _syncWeek(LearnerProfile storage profile, uint64 currentWeek) private {
        if (currentWeek > profile.activeWeek) {
            profile.activeWeek = currentWeek;
            profile.minutesThisWeek = 0;
        }
    }

    function _currentWeek() private view returns (uint64) {
        return uint64(block.timestamp / WEEK_IN_SECONDS);
    }

    function _currentDay() private view returns (uint64) {
        return uint64(block.timestamp / DAY_IN_SECONDS);
    }

    function _validateDisplayName(string calldata displayName) private pure {
        uint256 length = bytes(displayName).length;
        require(length >= 3 && length <= 32, "Display name must be 3-32 chars");
    }

    function _validateTopic(string calldata topic) private pure {
        uint256 length = bytes(topic).length;
        require(length >= 3 && length <= 48, "Topic must be 3-48 chars");
    }

    function _validateSessionMinutes(uint32 minutesSpent) private pure {
        require(
            minutesSpent >= MIN_SESSION_MINUTES && minutesSpent <= MAX_SESSION_MINUTES,
            "Session minutes out of range"
        );
    }

    function _validateWeeklyGoal(uint32 weeklyGoalMinutes) private pure {
        require(
            weeklyGoalMinutes >= MIN_GOAL_MINUTES && weeklyGoalMinutes <= MAX_GOAL_MINUTES,
            "Weekly goal out of range"
        );
    }
}
