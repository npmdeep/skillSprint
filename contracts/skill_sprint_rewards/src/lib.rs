#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Badges(Address),
}

#[contractevent]
#[derive(Clone)]
pub struct BadgeAwarded {
    #[topic]
    pub learner: Address,
    pub badge_type: u32,
}

#[contract]
pub struct SkillSprintRewards;

#[contractimpl]
impl SkillSprintRewards {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Not initialized"))
    }

    pub fn award_badge(env: Env, learner: Address, badge_type: u32) {
        // Require auth of the admin (the ledger contract calling this via ICC)
        let admin = Self::get_admin(env.clone());
        admin.require_auth();

        assert!(badge_type >= 1 && badge_type <= 10, "Invalid badge type");

        let mut badges: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::Badges(learner.clone()))
            .unwrap_or_else(|| Vec::new(&env));

        // Avoid duplicate badges of the same type
        if !badges.contains(badge_type) {
            badges.push_back(badge_type);
            env.storage()
                .persistent()
                .set(&DataKey::Badges(learner.clone()), &badges);

            BadgeAwarded {
                learner,
                badge_type,
            }
            .publish(&env);
        }
    }

    pub fn get_badges(env: Env, learner: Address) -> Vec<u32> {
        env.storage()
            .persistent()
            .get(&DataKey::Badges(learner))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Returns the total number of distinct badge types earned by a learner.
    pub fn get_badge_count(env: Env, learner: Address) -> u32 {
        let badges: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::Badges(learner))
            .unwrap_or_else(|| Vec::new(&env));
        badges.len()
    }

    /// Returns the highest badge type number earned by a learner, or 0 if none.
    pub fn get_highest_badge(env: Env, learner: Address) -> u32 {
        let badges: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::Badges(learner))
            .unwrap_or_else(|| Vec::new(&env));

        let mut highest: u32 = 0;
        for badge in badges.iter() {
            if badge > highest {
                highest = badge;
            }
        }
        highest
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup() -> (Env, SkillSprintRewardsClient<'static>, Address, Address) {
        let env = Env::default();
        let contract_id = env.register(SkillSprintRewards, ());
        let client = SkillSprintRewardsClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        env.mock_all_auths();
        (env, client, admin, contract_id)
    }

    #[test]
    fn awards_badge_and_reads_back() {
        let (env, client, _, _) = setup();
        let learner = Address::generate(&env);

        client.award_badge(&learner, &1);
        let badges = client.get_badges(&learner);
        assert_eq!(badges.len(), 1);
        assert!(badges.contains(1u32));
    }

    #[test]
    fn does_not_duplicate_same_badge() {
        let (env, client, _, _) = setup();
        let learner = Address::generate(&env);

        client.award_badge(&learner, &2);
        client.award_badge(&learner, &2);
        let badges = client.get_badges(&learner);
        assert_eq!(badges.len(), 1);
    }

    #[test]
    fn get_badge_count_returns_correct_count() {
        let (env, client, _, _) = setup();
        let learner = Address::generate(&env);

        assert_eq!(client.get_badge_count(&learner), 0);
        client.award_badge(&learner, &1);
        assert_eq!(client.get_badge_count(&learner), 1);
        client.award_badge(&learner, &2);
        assert_eq!(client.get_badge_count(&learner), 2);
        // Duplicate should not increase count
        client.award_badge(&learner, &1);
        assert_eq!(client.get_badge_count(&learner), 2);
    }

    #[test]
    fn get_highest_badge_returns_max() {
        let (env, client, _, _) = setup();
        let learner = Address::generate(&env);

        assert_eq!(client.get_highest_badge(&learner), 0);
        client.award_badge(&learner, &1);
        assert_eq!(client.get_highest_badge(&learner), 1);
        client.award_badge(&learner, &3);
        assert_eq!(client.get_highest_badge(&learner), 3);
    }

    #[test]
    #[should_panic(expected = "Invalid badge type")]
    fn rejects_invalid_badge_type_zero() {
        let (env, client, _, _) = setup();
        let learner = Address::generate(&env);
        client.award_badge(&learner, &0);
    }

    #[test]
    fn empty_learner_returns_empty_badges() {
        let (env, client, _, _) = setup();
        let learner = Address::generate(&env);
        let badges = client.get_badges(&learner);
        assert!(badges.is_empty());
    }
}
