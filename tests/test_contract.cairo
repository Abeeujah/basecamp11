use cum_laude::Counter;
use starknet::ContractAddress;

use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
    stop_cheat_caller_address, spy_events, EventSpyAssertionsTrait,
};

use cum_laude::{
    ICounterDispatcher, ICounterDispatcherTrait, ICounterSafeDispatcher,
    ICounterSafeDispatcherTrait,
};

use Counter::Errors::NEGATIVE_COUNTER;

fn OWNER() -> ContractAddress {
    'OWNER'.try_into().unwrap()
}

fn deploy_counter(initial_count: u32) -> (ICounterDispatcher, ICounterSafeDispatcher) {
    let contract = declare("Counter").unwrap().contract_class();

    let mut calldata = array![];
    initial_count.serialize(ref calldata);
    OWNER().serialize(ref calldata);

    let (contract_address, _) = contract.deploy(@calldata).unwrap();

    let dispatcher = ICounterDispatcher { contract_address };
    let safe_dispatcher = ICounterSafeDispatcher { contract_address };

    (dispatcher, safe_dispatcher)
}

#[test]
fn test_deploy_contract() {
    // Arrange
    let (counter, _) = deploy_counter(0);

    // Act
    let count = counter.get_counter();

    // Assert
    assert!(count == 0, "Count should be 0");
}

#[test]
fn test_get_counter() {
    // Arrange
    let (counter, _) = deploy_counter(0);
    // Act
    let count = counter.get_counter();
    // Assert
    assert!(count == 0, "Count should be 0");

    counter.increase_counter();
    let count = counter.get_counter();
    assert!(count == 1, "Count should be 1");

    counter.increase_counter();
    let count = counter.get_counter();
    assert!(count == 2, "Count should be 2");

    counter.decrease_counter();
    let count = counter.get_counter();
    assert!(count == 1, "Count should be 1");

    start_cheat_caller_address(counter.contract_address, OWNER());
    counter.reset_counter();
    let count = counter.get_counter();
    assert!(count == 0, "Count should be 0");
}


#[test]
fn test_increase_counter() {
    // Arrange
    let (counter, _) = deploy_counter(0);
    let mut spy = spy_events();

    // Act
    counter.increase_counter();
    let count = counter.get_counter();

    // Asserts
    spy
        .assert_emitted(
            @array![
                (
                    counter.contract_address,
                    Counter::Event::CounterIncreased(Counter::CounterIncreased { counter: count }),
                ),
            ],
        );
    assert!(count == 1, "Counter should increment")
}

#[test]
fn test_decrease_counter() {
    // Arrange
    let (counter, _) = deploy_counter(1);
    let mut spy = spy_events();

    // Act
    counter.decrease_counter();
    let count = counter.get_counter();

    // Asserts
    spy
        .assert_emitted(
            @array![
                (
                    counter.contract_address,
                    Counter::Event::CounterDecreased(Counter::CounterDecreased { counter: count }),
                ),
            ],
        );
    assert!(count == 0, "Counter should decrement");
}

#[test]
#[feature("safe_dispatcher")]
fn test_decrease_counter_underflow() {
    // Arrange
    let (_, safe_counter) = deploy_counter(0);

    // Asserts
    match safe_counter.decrease_counter() {
        Result::Ok(_) => panic!("Underflow should panic"),
        Result::Err(panic_data) => {
            assert!(*panic_data[0] == NEGATIVE_COUNTER, "Should throw NEGATIVE COUNTER error")
        },
    }
}

#[test]
#[should_panic]
fn test_increase_counter_overflow() {
    let (counter, _) = deploy_counter(0xFFFFFFFF);
    counter.increase_counter();
}

#[test]
#[feature("safe_dispatcher")]
fn test_reset_counter_non_owner() {
    // Arrange
    let (counter, safe_counter) = deploy_counter(5);

    // Asserts
    match safe_counter.reset_counter() {
        Result::Ok(_) => panic!("non-owner cannot reset the counter"),
        Result::Err(panic_data) => {
            assert!(
                *panic_data[0] == 'Caller is not the owner',
                "Should error if caller is not the owner",
            )
        },
    }

    assert!(counter.get_counter() == 5, "Counter should not have reset");
}

#[test]
fn test_reset_counter_as_owner() {
    // Arrange
    let (counter, _) = deploy_counter(5);
    counter.increase_counter();

    // Act
    start_cheat_caller_address(counter.contract_address, OWNER());
    counter.reset_counter();
    stop_cheat_caller_address(counter.contract_address);

    // Assert
    assert!(counter.get_counter() == 0, "Counter should be reset to 0");
}
