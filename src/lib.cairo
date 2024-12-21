#[starknet::interface]
pub trait ICounter<TContractState> {
    fn get_counter(self: @TContractState) -> u32;
    fn increase_counter(ref self: TContractState);
    fn decrease_counter(ref self: TContractState);
    fn reset_counter(ref self: TContractState);
}

#[starknet::contract]
pub mod Counter {
    use OwnableComponent::InternalTrait;
    use super::ICounter;
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::{
        ContractAddress, event::EventEmitter,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess},
    };

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableTwoStep = OwnableComponent::OwnableTwoStepImpl<ContractState>;
    impl InternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        counter: u32,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CounterDecreased {
        pub counter: u32,
    }

    #[derive(Drop, starknet::Event)]
    pub struct CounterIncreased {
        pub counter: u32,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        CounterDecreased: CounterDecreased,
        CounterIncreased: CounterIncreased,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    pub mod Errors {
        pub const NEGATIVE_COUNTER: felt252 = 'Counter can\'t be negative';
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_value: u32, owner: ContractAddress) {
        self.counter.write(init_value);
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl CounterImpl of ICounter<ContractState> {
        fn get_counter(self: @ContractState) -> u32 {
            self.counter.read()
        }

        fn increase_counter(ref self: ContractState) {
            self.counter.write(self.counter.read() + 1);
            self.emit(CounterIncreased { counter: self.counter.read() });
        }

        fn decrease_counter(ref self: ContractState) {
            assert(self.counter.read() > 0, Errors::NEGATIVE_COUNTER);
            self.counter.write(self.counter.read() - 1);
            self.emit(CounterDecreased { counter: self.counter.read() });
        }

        fn reset_counter(ref self: ContractState) {
            self.ownable.assert_only_owner();
            self.counter.write(0);
        }
    }
}
