"use client";

import { ABI } from "@/abis/abi";
import { Spinner } from "@/components/ui/Spinner";
import { formatAmount } from "@/lib/utils";
import {
  useAccount,
  useBalance,
  useBlockNumber,
  useContract,
  useReadContract,
  useSendTransaction,
  useTransactionReceipt,
} from "@starknet-react/core";
import dynamic from "next/dynamic";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RpcProvider } from "starknet";

// Constants
const CONTRACT_ADDRESS =
  "0x06e81857e2291c15c20251f6044695bf12dbfd74fd82dd635f1437c4f65b3163";
const WORKSHOP_END_BLOCK = 450000;

// Dynamic imports
const WalletBar = dynamic(() => import("../components/WalletBar"), {
  ssr: false,
});

// Types
interface ContractEvent {
  from_address: string;
  keys: string[];
  data: string[];
}

// Helper functions
const isWorkshopOpen = (
  blockNumberIsError: boolean,
  blockNumberIsLoading: boolean,
  blockNumberData: number | undefined,
  workShopEnd: number
): boolean => {
  return (
    !blockNumberIsError &&
    !blockNumberIsLoading &&
    blockNumberData !== undefined &&
    blockNumberData < workShopEnd
  );
};

const Page: FC = () => {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const lastCheckedBlockRef = useRef(0);
  const { address: userAddress } = useAccount();

  // Block data
  const {
    data: blockNumberData,
    isLoading: blockNumberIsLoading,
    isError: blockNumberIsError,
  } = useBlockNumber({ blockIdentifier: "latest" });

  // Balance data
  const {
    data: balanceData,
    isLoading: balanceDataIsLoading,
    isError: balanceDataIsError,
  } = useBalance({ address: userAddress, watch: true });

  // Contract interactions
  const {
    data: readCount,
    isLoading: readCountIsLoading,
    isError: readCountIsError,
    refetch: readCountRefetch,
  } = useReadContract({
    functionName: "get_counter",
    address: CONTRACT_ADDRESS,
    abi: ABI,
  });

  const { contract } = useContract({
    abi: ABI,
    address: CONTRACT_ADDRESS,
  });

  // Calls for increase, decrease, and reset
  const increaseCalls = useMemo(() => {
    if (!userAddress || !contract) return [];
    return [contract.populate("increase_counter")];
  }, [userAddress, contract]);

  const decreaseCalls = useMemo(() => {
    if (!userAddress || !contract) return [];
    return [contract.populate("decrease_counter")];
  }, [userAddress, contract]);

  const resetCalls = useMemo(() => {
    if (!userAddress || !contract) return [];
    return [contract.populate("reset_counter")];
  }, [userAddress, contract]);

  // Transactions for all operations
  const {
    send: increaseCounter,
    data: increaseData,
    isPending: increaseIsPending,
  } = useSendTransaction({ calls: increaseCalls });

  const {
    send: decreaseCounter,
    data: decreaseData,
    isPending: decreaseIsPending,
  } = useSendTransaction({ calls: decreaseCalls });

  const {
    send: resetCounter,
    data: resetData,
    isPending: resetIsPending,
  } = useSendTransaction({ calls: resetCalls });

  // Transaction receipts for all operations
  const { status: increaseStatus, isLoading: increaseWaitLoading } =
    useTransactionReceipt({
      watch: true,
      hash: increaseData?.transaction_hash,
    });

  const { status: decreaseStatus, isLoading: decreaseWaitLoading } =
    useTransactionReceipt({
      watch: true,
      hash: decreaseData?.transaction_hash,
    });

  const { status: resetStatus, isLoading: resetWaitLoading } =
    useTransactionReceipt({
      watch: true,
      hash: resetData?.transaction_hash,
    });

  // Event handling
  const provider = useMemo(
    () => new RpcProvider({ nodeUrl: process.env.NEXT_PUBLIC_RPC_URL }),
    []
  );

  const checkForEvents = useCallback(
    async (currentBlockNumber: number) => {
      if (currentBlockNumber <= lastCheckedBlockRef.current) return;
      try {
        const fetchedEvents = await provider.getEvents({
          address: contract?.address,
          from_block: { block_number: lastCheckedBlockRef.current + 1 },
          to_block: { block_number: currentBlockNumber },
          chunk_size: 500,
        });

        if (fetchedEvents?.events) {
          setEvents((prev) => [...prev, ...fetchedEvents.events]);
        }
        lastCheckedBlockRef.current = currentBlockNumber;
      } catch (error) {
        console.error("Error checking for events:", error);
      }
    },
    [provider, contract]
  );

  useEffect(() => {
    if (contract && blockNumberData) {
      checkForEvents(blockNumberData);
    }
  }, [contract, blockNumberData, checkForEvents]);

  const lastFiveEvents = useMemo(() => {
    return [...events].reverse().slice(0, 5);
  }, [events]);

  const handleIncrease = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await increaseCounter();
  };

  const handleDecrease = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await decreaseCounter();
  };

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await resetCounter();
  };

  const getTransactionLink = (hash?: string) => {
    if (!hash) return null;
    return (
      <a
        href={`https://sepolia.voyager.online/tx/${hash}`}
        target="_blank"
        className="block mt-2 text-blue-500 hover:text-blue-700 underline"
        rel="noreferrer"
      >
        Check TX on Sepolia
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-gray-300 p-4 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-6 text-black">
        Starknet Frontend Workshop
      </h1>

      <div className="flex flex-wrap justify-center gap-4">
        <div className="w-full max-w-md space-y-4">
          {/* Wallet Connection */}
          <div className="bg-white p-4 border-none rounded-lg">
            <h2 className="text-xl font-bold text-blue-500 text-center mb-5">
              Wallet Connection
            </h2>
            <WalletBar />
          </div>

          {/* Block Status */}
          <div
            className={`p-4 border-none rounded-lg ${
              isWorkshopOpen(
                blockNumberIsError,
                blockNumberIsLoading,
                blockNumberData,
                WORKSHOP_END_BLOCK
              )
                ? "bg-green-700"
                : "bg-red-500"
            } transition-colors`}
          >
            <h3 className="text-lg font-bold mb-2 text-center text-blue-500">
              Read the Latest Block
            </h3>
            {!blockNumberIsError && blockNumberIsLoading ? (
              <Spinner />
            ) : (
              <>
                <p>Current Block: {blockNumberData}</p>
                <p>
                  Workshop
                  {isWorkshopOpen(
                    blockNumberIsError,
                    blockNumberIsLoading,
                    blockNumberData,
                    WORKSHOP_END_BLOCK
                  )
                    ? " is live "
                    : " has ended"}
                </p>
              </>
            )}
          </div>

          {/* Wallet Balance */}
          <div className="p-4 border-none bg-white text-black rounded-lg">
            <h3 className="text-lg font-bold mb-2 text-center text-blue-500">
              Wallet Balance
            </h3>
            {!balanceDataIsError && balanceDataIsLoading ? (
              <Spinner />
            ) : (
              <>
                <p className="text-black">Symbol: {balanceData?.symbol}</p>
                <p className="text-black">
                  Balance: {Number(balanceData?.formatted).toFixed(5)}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="w-full max-w-md space-y-4">
          {/* Contract Balance */}
          <div className="p-4 border-none bg-white rounded-lg text-black">
            <h3 className="text-lg font-bold mb-2 text-blue-500 text-center">
              Contract Balance
            </h3>
            {!readCountIsError && readCountIsLoading ? (
              <Spinner />
            ) : (
              <>
                <p className="text-black">Balance: {readCount?.toString()}</p>
                <button
                  onClick={() => readCountRefetch()}
                  className="mt-2 border rounded-full text-white font-regular py-2 px-7 bg-green-500 hover:bg-green-700"
                >
                  Refresh
                </button>
              </>
            )}
          </div>

          {/* Counter Controls */}
          <div className="p-4 border-none bg-white rounded-lg">
            <h3 className="text-lg font-bold mb-2 text-blue-500 text-center">
              Counter Controls
            </h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {/* Increase Counter */}
              <form onSubmit={handleIncrease} className="flex-1 min-w-[120px]">
                <button
                  type="submit"
                  disabled={!userAddress || increaseIsPending}
                  className="w-full mt-3 border border-none rounded-full text-black font-regular py-2 px-4 bg-yellow-300 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {(() => {
                    if (increaseIsPending) return "Increasing...";
                    if (increaseWaitLoading)
                      return "Waiting for confirmation...";
                    switch (increaseStatus) {
                      case "error":
                        return "Transaction rejected";
                      case "success":
                        return "Increased!";
                      default:
                        return "Increase";
                    }
                  })()}
                </button>
                {getTransactionLink(increaseData?.transaction_hash)}
              </form>

              {/* Decrease Counter */}
              <form onSubmit={handleDecrease} className="flex-1 min-w-[120px]">
                <button
                  type="submit"
                  disabled={!userAddress || decreaseIsPending}
                  className="w-full mt-3 border border-none rounded-full text-black font-regular py-2 px-4 bg-red-300 hover:bg-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {(() => {
                    if (decreaseIsPending) return "Decreasing...";
                    if (decreaseWaitLoading)
                      return "Waiting for confirmation...";
                    switch (decreaseStatus) {
                      case "error":
                        return "Transaction rejected";
                      case "success":
                        return "Decreased!";
                      default:
                        return "Decrease";
                    }
                  })()}
                </button>
                {getTransactionLink(decreaseData?.transaction_hash)}
              </form>

              {/* Reset Counter */}
              <form onSubmit={handleReset} className="w-full">
                <button
                  type="submit"
                  disabled={!userAddress || resetIsPending}
                  className="w-full mt-3 border border-none rounded-full text-black font-regular py-2 px-4 bg-gray-200 hover:bg-gray-400 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {(() => {
                    if (resetIsPending) return "Resetting...";
                    if (resetWaitLoading) return "Waiting for confirmation...";
                    switch (resetStatus) {
                      case "error":
                        return "Transaction rejected";
                      case "success":
                        return "Reset!";
                      default:
                        return "Reset Counter";
                    }
                  })()}
                </button>
                {getTransactionLink(resetData?.transaction_hash)}
              </form>
            </div>
          </div>

          {/* Events Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-black">
              <thead>
                <tr>
                  <th className="border-b border-gray-300 text-left p-2 font-semibold">
                    #
                  </th>
                  <th className="border-b border-gray-300 text-right p-2 font-semibold">
                    New Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {lastFiveEvents.map((event, index) => (
                  <tr key={index} className="bg-gray-50">
                    <td className="border-b border-gray-200 p-2">
                      {lastFiveEvents.length - index}
                    </td>
                    <td className="border-b border-gray-200 p-2 text-right">
                      {event.data.length > 0
                        ? formatAmount(event.data[0])
                        : "value 0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
