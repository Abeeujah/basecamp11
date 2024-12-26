export const ABI = [
  {
    name: "CounterImpl",
    type: "impl",
    interface_name: "cum_laude::ICounter",
  },
  {
    name: "cum_laude::ICounter",
    type: "interface",
    items: [
      {
        name: "get_counter",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::integer::u32",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "increase_counter",
        type: "function",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "decrease_counter",
        type: "function",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "reset_counter",
        type: "function",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    name: "OwnableTwoStep",
    type: "impl",
    interface_name: "openzeppelin_access::ownable::interface::IOwnableTwoStep",
  },
  {
    name: "openzeppelin_access::ownable::interface::IOwnableTwoStep",
    type: "interface",
    items: [
      {
        name: "owner",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "pending_owner",
        type: "function",
        inputs: [],
        outputs: [
          {
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        state_mutability: "view",
      },
      {
        name: "accept_ownership",
        type: "function",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "transfer_ownership",
        type: "function",
        inputs: [
          {
            name: "new_owner",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        name: "renounce_ownership",
        type: "function",
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
    ],
  },
  {
    name: "constructor",
    type: "constructor",
    inputs: [
      {
        name: "init_value",
        type: "core::integer::u32",
      },
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "cum_laude::Counter::CounterDecreased",
    type: "event",
    members: [
      {
        kind: "data",
        name: "counter",
        type: "core::integer::u32",
      },
    ],
  },
  {
    kind: "struct",
    name: "cum_laude::Counter::CounterIncreased",
    type: "event",
    members: [
      {
        kind: "data",
        name: "counter",
        type: "core::integer::u32",
      },
    ],
  },
  {
    kind: "struct",
    name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
    type: "event",
    members: [
      {
        kind: "key",
        name: "previous_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "new_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "struct",
    name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
    type: "event",
    members: [
      {
        kind: "key",
        name: "previous_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        kind: "key",
        name: "new_owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
  },
  {
    kind: "enum",
    name: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "OwnershipTransferred",
        type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred",
      },
      {
        kind: "nested",
        name: "OwnershipTransferStarted",
        type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted",
      },
    ],
  },
  {
    kind: "enum",
    name: "cum_laude::Counter::Event",
    type: "event",
    variants: [
      {
        kind: "nested",
        name: "CounterDecreased",
        type: "cum_laude::Counter::CounterDecreased",
      },
      {
        kind: "nested",
        name: "CounterIncreased",
        type: "cum_laude::Counter::CounterIncreased",
      },
      {
        kind: "flat",
        name: "OwnableEvent",
        type: "openzeppelin_access::ownable::ownable::OwnableComponent::Event",
      },
    ],
  },
] as const;
