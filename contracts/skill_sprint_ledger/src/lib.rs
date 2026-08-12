#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env, String, Vec, IntoVal};

const DAY_IN_SECONDS: u64 = 86_400;
const WEEK_IN_SECONDS: u64 = 604_800;

pub const MIN_SESSION_MINUTES: u32 = 5;
pub const MAX_SESSION_MINUTES: u32 = 480;
pub const MIN_GOAL_MINUTES: u32 = 30;
pub const MAX_GOAL_MINUTES: u32 = 5_000;

#[derive(Clone)]
#[contracttype]
pub struct LearnerProfile {
    pub display_name: String,
    pub created_at: u64,
    pub last_study_day: u64,
    pub active_week: u64,
    pub weekly_goal_minutes: u32,
    pub total_minutes: u32,
    pub minutes_this_week: u32,
    pub session_count: u32,
    pub current_streak: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct StudySession {
    pub topic: String,
    pub minutes_spent: u32,
    pub timestamp: u64,
    pub streak_after_log: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct Dashboard {
    pub display_name: String,
    pub weekly_goal_minutes: u32,
    pub total_minutes: u32,
    pub minutes_this_week: u32,
    pub session_count: u32,
    pub current_streak: u32,
    pub created_at: u64,
    pub goal_reached_this_week: bool,
}

/// Entry returned by get_leaderboard_snapshot for ranking learners.
#[derive(Clone)]
#[contracttype]
pub struct LeaderboardEntry {
    pub learner: Address,
    pub display_name: String,
    pub total_minutes: u32,
    pub current_streak: u32,
    pub session_count: u32,
}

#[contractevent]
#[derive(Clone)]
pub struct ProfileSaved {
    #[topic]
    pub learner: Address,
    pub display_name: String,
    pub weekly_goal_minutes: u32,
}

#[contractevent]
#[derive(Clone)]
pub struct WeeklyGoalUpdated {
    #[topic]
    pub learner: Address,
    pub weekly_goal_minutes: u32,
}

#[contractevent]
#[derive(Clone)]
pub struct StudySessionLogged {
    #[topic]
    pub learner: Address,
    pub topic: String,
    pub minutes_spent: u32,
    pub minutes_this_week: u32,
    pub current_streak: u32,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Profile(Address),
    Session(Address, u32),
    Admin,
    RewardsContract,
    LearnerCount,
}

#[contract]
pub struct SkillSprintLedger;

#[contractimpl]
impl SkillSprintLedger {
    pub fn initialize(env: Env, admin: Address, rewards_contract: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::RewardsContract, &rewards_contract);
        env.storage().instance().set(&DataKey::LearnerCount, &0u32);
    }

    pub fn get_rewards_contract(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::RewardsContract)
            .unwrap_or_else(|| panic!("Rewards contract not configured"))
    }

    /// Returns the total number of unique learner profiles registered.
    pub fn get_total_learners(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::LearnerCount)
            .unwrap_or(0u32)
    }

    pub fn save_profile(env: Env, learner: Address, display_name: String, weekly_goal_minutes: u32) {
        learner.require_auth();
        validate_display_name(&display_name);
        validate_weekly_goal(weekly_goal_minutes);

        let now = env.ledger().timestamp();
        let current_week = current_week(&env);

        let is_new = !env
            .storage()
            .persistent()
            .has(&DataKey::Profile(learner.clone()));

        let mut profile = read_profile_optional(&env, &learner).unwrap_or(LearnerProfile {
            display_name: display_name.clone(),
            created_at: now,
            last_study_day: 0,
            active_week: current_week,
            weekly_goal_minutes,
            total_minutes: 0,
            minutes_this_week: 0,
            session_count: 0,
            current_streak: 0,
        });

        sync_week(&mut profile, current_week);
        profile.display_name = display_name.clone();
        profile.weekly_goal_minutes = weekly_goal_minutes;

        write_profile(&env, &learner, &profile);

        // Increment global learner count only for brand-new profiles
        if is_new {
            let count: u32 = env
                .storage()
                .instance()
                .get(&DataKey::LearnerCount)
                .unwrap_or(0u32);
            env.storage()
                .instance()
                .set(&DataKey::LearnerCount, &count.saturating_add(1));
        }

        ProfileSaved {
            learner,
            display_name,
            weekly_goal_minutes,
        }
        .publish(&env);
    }

    pub fn update_weekly_goal(env: Env, learner: Address, new_goal_minutes: u32) {
        learner.require_auth();
        validate_weekly_goal(new_goal_minutes);

        let mut profile = read_profile_required(&env, &learner);
        sync_week(&mut profile, current_week(&env));
        profile.weekly_goal_minutes = new_goal_minutes;

        write_profile(&env, &learner, &profile);
        WeeklyGoalUpdated {
            learner,
            weekly_goal_minutes: new_goal_minutes,
        }
        .publish(&env);
    }

    pub fn log_session(env: Env, learner: Address, topic: String, minutes_spent: u32) {
        learner.require_auth();
        validate_topic(&topic);
        validate_session_minutes(minutes_spent);

        let mut profile = read_profile_required(&env, &learner);
        sync_week(&mut profile, current_week(&env));

        let current_day = current_day(&env);
        if profile.session_count == 0 {
            profile.current_streak = 1;
        } else if current_day == profile.last_study_day {
            // Same day — streak unchanged
        } else if current_day == profile.last_study_day + 1 {
            profile.current_streak = profile.current_streak.saturating_add(1);
        } else {
            profile.current_streak = 1;
        }

        profile.last_study_day = current_day;
        // Use saturating_add to guard against theoretical u32 overflow
        profile.total_minutes = profile.total_minutes.saturating_add(minutes_spent);
        profile.minutes_this_week = profile.minutes_this_week.saturating_add(minutes_spent);

        let session = StudySession {
            topic: topic.clone(),
            minutes_spent,
            timestamp: env.ledger().timestamp(),
            streak_after_log: profile.current_streak,
        };

        write_session(&env, &learner, profile.session_count, &session);
        profile.session_count = profile.session_count.saturating_add(1);
        write_profile(&env, &learner, &profile);

        StudySessionLogged {
            learner: learner.clone(),
            topic,
            minutes_spent,
            minutes_this_week: profile.minutes_this_week,
            current_streak: profile.current_streak,
        }
        .publish(&env);

        // Inter-Contract Communication (ICC): Trigger achievement award milestones
        if let Some(rewards_contract) = env.storage().instance().get::<_, Address>(&DataKey::RewardsContract) {
            let total_min = profile.total_minutes;
            let mut badge_type: u32 = 0;
            if total_min >= 1000 {
                badge_type = 3; // Gold Learner
            } else if total_min >= 300 {
                badge_type = 2; // Silver Learner
            } else if total_min >= 60 {
                badge_type = 1; // Bronze Learner
            }

            if badge_type > 0 {
                env.invoke_contract::<()>(
                    &rewards_contract,
                    &soroban_sdk::Symbol::new(&env, "award_badge"),
                    soroban_sdk::vec![&env, learner.into_val(&env), badge_type.into_val(&env)],
                );
            }
        }
    }

    pub fn has_profile(env: Env, learner: Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Profile(learner))
    }

    pub fn get_dashboard(env: Env, learner: Address) -> Dashboard {
        let mut profile = read_profile_required(&env, &learner);
        if current_week(&env) > profile.active_week {
            profile.minutes_this_week = 0;
        }

        Dashboard {
            display_name: profile.display_name,
            weekly_goal_minutes: profile.weekly_goal_minutes,
            total_minutes: profile.total_minutes,
            minutes_this_week: profile.minutes_this_week,
            session_count: profile.session_count,
            current_streak: profile.current_streak,
            created_at: profile.created_at,
            goal_reached_this_week: profile.minutes_this_week >= profile.weekly_goal_minutes,
        }
    }

    pub fn get_session_count(env: Env, learner: Address) -> u32 {
        read_profile_optional(&env, &learner)
            .map(|profile| profile.session_count)
            .unwrap_or(0)
    }

    pub fn get_session(env: Env, learner: Address, index: u32) -> StudySession {
        let count = Self::get_session_count(env.clone(), learner.clone());
        assert!(index < count, "Session index out of bounds");

        env.storage()
            .persistent()
            .get(&DataKey::Session(learner, index))
            .unwrap_or_else(|| panic!("Session not found"))
    }

    /// Returns a leaderboard snapshot for the provided list of learner addresses.
    /// Entries are returned sorted by total_minutes descending.
    /// Addresses with no profile are silently skipped.
    pub fn get_leaderboard_snapshot(env: Env, learners: Vec<Address>) -> Vec<LeaderboardEntry> {
        let mut entries: Vec<LeaderboardEntry> = Vec::new(&env);

        for learner in learners.iter() {
            if let Some(profile) = read_profile_optional(&env, &learner) {
                entries.push_back(LeaderboardEntry {
                    learner,
                    display_name: profile.display_name,
                    total_minutes: profile.total_minutes,
                    current_streak: profile.current_streak,
                    session_count: profile.session_count,
                });
            }
        }

        // Insertion-sort by total_minutes descending.`n        // The Soroban no_std environment does not have access to std::sort,`n        // so we use a simple insertion sort (O(n^2)) which is acceptable for`n        // the small N typically passed to this view function.
        let len = entries.len();
        if len <= 1 {
            return entries;
        }

        // Build a sorted vec manually
        let mut sorted: Vec<LeaderboardEntry> = Vec::new(&env);
        for entry in entries.iter() {
            let mut inserted = false;
            let sorted_len = sorted.len();
            // Find insertion point
            let mut insert_at: u32 = sorted_len;
            for i in 0..sorted_len {
                if entry.total_minutes > sorted.get(i).unwrap().total_minutes {
                    insert_at = i;
                    break;
                }
            }
            if !inserted {
                if insert_at == sorted_len {
                    sorted.push_back(entry.clone());
                } else {
                    // Rebuild with insertion
                    let mut rebuilt: Vec<LeaderboardEntry> = Vec::new(&env);
                    for i in 0..sorted_len {
                        if i == insert_at {
                            rebuilt.push_back(entry.clone());
                        }
                        rebuilt.push_back(sorted.get(i).unwrap());
                    }
                    sorted = rebuilt;
                }
                inserted = true;
            }
            let _ = inserted; // suppress unused variable warning
        }

        sorted
    }
}

fn read_profile_optional(env: &Env, learner: &Address) -> Option<LearnerProfile> {
    env.storage()
        .persistent()
        .get(&DataKey::Profile(learner.clone()))
}

fn read_profile_required(env: &Env, learner: &Address) -> LearnerProfile {
    read_profile_optional(env, learner).unwrap_or_else(|| panic!("Profile not found"))
}

fn write_profile(env: &Env, learner: &Address, profile: &LearnerProfile) {
    env.storage()
        .persistent()
        .set(&DataKey::Profile(learner.clone()), profile);
}

fn write_session(env: &Env, learner: &Address, index: u32, session: &StudySession) {
    env.storage()
        .persistent()
        .set(&DataKey::Session(learner.clone(), index), session);
}

fn sync_week(profile: &mut LearnerProfile, current_week: u64) {
    if current_week > profile.active_week {
        profile.active_week = current_week;
        profile.minutes_this_week = 0;
    }
}

fn current_week(env: &Env) -> u64 {
    env.ledger().timestamp() / WEEK_IN_SECONDS
}

fn current_day(env: &Env) -> u64 {
    env.ledger().timestamp() / DAY_IN_SECONDS
}

fn validate_display_name(display_name: &String) {
    let length = display_name.len();
    assert!(length >= 3 && length <= 32, "Display name must be 3-32 chars");
}

fn validate_topic(topic: &String) {
    let length = topic.len();
    assert!(length >= 3 && length <= 48, "Topic must be 3-48 chars");
    // Guard against whitespace-only topics that pass the length check.
    // soroban_sdk::String::to_bytes() returns a soroban Bytes object whose
    // iter() yields u32 values. ASCII space is 0x20 = 32u32.
    let bytes = topic.to_bytes();
    let all_spaces = bytes.iter().all(|b| b == b' ');
    assert!(!all_spaces, "Topic must not be blank");
}

fn validate_session_minutes(minutes_spent: u32) {
    assert!(
        (MIN_SESSION_MINUTES..=MAX_SESSION_MINUTES).contains(&minutes_spent),
        "Session minutes out of range"
    );
}

fn validate_weekly_goal(weekly_goal_minutes: u32) {
    assert!(
        (MIN_GOAL_MINUTES..=MAX_GOAL_MINUTES).contains(&weekly_goal_minutes),
        "Weekly goal out of range"
    );
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[contract]
    pub struct MockRewardsContract;

    #[contractimpl]
    impl MockRewardsContract {
        pub fn initialize(_env: Env, _admin: Address) {}
        pub fn award_badge(_env: Env, _learner: Address, _badge_type: u32) {}
    }

    fn setup() -> (Env, SkillSprintLedgerClient<'static>, Address, Address) {
        let env = Env::default();
        let contract_id = env.register(SkillSprintLedger, ());
        let client = SkillSprintLedgerClient::new(&env, &contract_id);

        let rewards_id = env.register(MockRewardsContract, ());
        let admin = Address::generate(&env);

        client.initialize(&admin, &rewards_id);

        env.mock_all_auths();
        (env, client, admin, rewards_id)
    }

    fn text(env: &Env, value: &str) -> String {
        String::from_str(env, value)
    }

    #[test]
    fn creates_profile_and_reads_dashboard() {
        let (env, client, learner, _) = setup();

        client.save_profile(&learner, &text(&env, "Deep Builder"), &360);
        let dashboard = client.get_dashboard(&learner);

        assert_eq!(dashboard.display_name, text(&env, "Deep Builder"));
        assert_eq!(dashboard.weekly_goal_minutes, 360);
        assert_eq!(dashboard.total_minutes, 0);
        assert!(!dashboard.goal_reached_this_week);
    }

    #[test]
    fn logs_sessions_and_grows_streak_across_days() {
        let (env, client, learner, _) = setup();

        client.save_profile(&learner, &text(&env, "Protocol Pilot"), &300);
        client.log_session(&learner, &text(&env, "Rust basics"), &90);

        env.ledger().set_timestamp(DAY_IN_SECONDS + 90);
        client.log_session(&learner, &text(&env, "Soroban auth"), &45);

        let dashboard = client.get_dashboard(&learner);
        let session = client.get_session(&learner, &1);

        assert_eq!(dashboard.total_minutes, 135);
        assert_eq!(dashboard.minutes_this_week, 135);
        assert_eq!(dashboard.session_count, 2);
        assert_eq!(dashboard.current_streak, 2);
        assert_eq!(session.topic, text(&env, "Soroban auth"));
        assert_eq!(session.minutes_spent, 45);
    }

    #[test]
    fn resets_weekly_progress_after_boundary() {
        let (env, client, learner, _) = setup();

        client.save_profile(&learner, &text(&env, "Weekly Runner"), &240);
        client.log_session(&learner, &text(&env, "Storage design"), &120);

        env.ledger().set_timestamp(WEEK_IN_SECONDS + DAY_IN_SECONDS);
        let dashboard = client.get_dashboard(&learner);

        assert_eq!(dashboard.minutes_this_week, 0);
        assert_eq!(dashboard.total_minutes, 120);
    }

    #[test]
    #[should_panic(expected = "Profile not found")]
    fn rejects_missing_profile_session_logs() {
        let (env, client, learner, _) = setup();
        client.log_session(&learner, &text(&env, "No profile yet"), &60);
    }

    #[test]
    #[should_panic(expected = "Display name must be 3-32 chars")]
    fn rejects_short_display_names() {
        let (env, client, learner, _) = setup();
        client.save_profile(&learner, &text(&env, "AB"), &200);
    }

    #[test]
    #[should_panic(expected = "Session minutes out of range")]
    fn rejects_short_sessions() {
        let (env, client, learner, _) = setup();
        client.save_profile(&learner, &text(&env, "Focus Friend"), &200);
        client.log_session(&learner, &text(&env, "Edge case"), &4);
    }

    #[test]
    #[should_panic(expected = "Weekly goal out of range")]
    fn rejects_bad_goal_updates() {
        let (env, client, learner, _) = setup();
        client.save_profile(&learner, &text(&env, "Goal Guard"), &200);
        client.update_weekly_goal(&learner, &20);
    }

    // --- New tests for F1: LearnerCount ---

    #[test]
    fn tracks_total_learner_count() {
        let (env, client, learner_a, _) = setup();
        let learner_b = Address::generate(&env);

        assert_eq!(client.get_total_learners(), 0);

        client.save_profile(&learner_a, &text(&env, "Alice Builder"), &120);
        assert_eq!(client.get_total_learners(), 1);

        client.save_profile(&learner_b, &text(&env, "Bob Builder"), &180);
        assert_eq!(client.get_total_learners(), 2);

        // Re-saving the same learner should not increment the count
        client.save_profile(&learner_a, &text(&env, "Alice Updated"), &240);
        assert_eq!(client.get_total_learners(), 2);
    }

    // --- New test: whitespace topic rejection ---

    #[test]
    #[should_panic(expected = "Topic must not be blank")]
    fn rejects_whitespace_only_topic() {
        let (env, client, learner, _) = setup();
        client.save_profile(&learner, &text(&env, "Blank Tester"), &200);
        // "   " is 3 chars — passes length check but must fail blank check
        client.log_session(&learner, &text(&env, "   "), &30);
    }

    // --- New test: leaderboard snapshot ---

    #[test]
    fn leaderboard_snapshot_sorted_by_total_minutes() {
        let (env, client, learner_a, _) = setup();
        let learner_b = Address::generate(&env);
        let learner_c = Address::generate(&env);

        client.save_profile(&learner_a, &text(&env, "Alice"), &120);
        client.save_profile(&learner_b, &text(&env, "Bob"), &120);
        client.save_profile(&learner_c, &text(&env, "Carol"), &120);

        client.log_session(&learner_a, &text(&env, "Rust basics"), &60);
        client.log_session(&learner_b, &text(&env, "Soroban"), &200);
        client.log_session(&learner_c, &text(&env, "Frontend"), &90);

        let learners = soroban_sdk::vec![&env, learner_a.clone(), learner_b.clone(), learner_c.clone()];
        let board = client.get_leaderboard_snapshot(&learners);

        assert_eq!(board.len(), 3);
        // Bob has most minutes (200) → should be first
        assert_eq!(board.get(0).unwrap().display_name, text(&env, "Bob"));
        assert_eq!(board.get(0).unwrap().total_minutes, 200);
    }

    // --- New test: streak streak does not double-count same-day sessions ---

    #[test]
    fn same_day_session_does_not_advance_streak() {
        let (env, client, learner, _) = setup();

        client.save_profile(&learner, &text(&env, "Day Sampler"), &100);
        client.log_session(&learner, &text(&env, "Morning session"), &30);
        client.log_session(&learner, &text(&env, "Evening session"), &30);

        let dashboard = client.get_dashboard(&learner);
        assert_eq!(dashboard.current_streak, 1);
        assert_eq!(dashboard.total_minutes, 60);
    }
}
