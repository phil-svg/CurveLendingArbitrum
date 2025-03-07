import { Contract } from 'web3-eth-contract';
import { EventEmitter } from 'stream';
import { EnrichedLendingMarketEvent, TransactionReceipt } from '../utils/Interfaces.js';
import { fetchEventsRealTime, registerHandler } from './AllEvents.js';
import { web3HttpProvider } from './Web3Basics.js';

function isCupsErr(err: Error): boolean {
  return err.message.includes('compute units per second capacity');
}

function isError(err: unknown): err is Error {
  return err instanceof Error;
}

async function delay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 280));
}

async function randomDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (400 - 200 + 1) + 200)));
}

export async function getCurrentBlockNumber(): Promise<number | null> {
  let shouldContinue = true;
  let retries = 0;
  const maxRetries = 12;
  let blockNumber: number | null = null;

  while (shouldContinue && retries < maxRetries && !blockNumber) {
    try {
      blockNumber = await web3HttpProvider.eth.getBlockNumber();
    } catch (error) {
      if (isError(error) && isCupsErr(error)) {
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (400 - 200 + 1) + 200)));
      } else {
        if (isError(error)) {
          console.log('Error in getCurrentBlockNumber', blockNumber, error.message);
        } else {
          console.log('Error in getCurrentBlockNumber', blockNumber, 'Unknown error');
        }
        shouldContinue = false;
      }
    }

    retries++;

    if (!blockNumber && shouldContinue) {
      await delay();
    }
  }

  return blockNumber;
}

export async function getPastEvents(
  CONTRACT: Contract,
  eventName: string,
  fromBlock: number | null,
  toBlock: number | null
): Promise<Array<object> | { start: number; end: number } | null> {
  if (fromBlock === null || toBlock === null) {
    return null;
  }

  let retries = 0;
  const maxRetries = 12;
  let EVENT_ARRAY: Array<object> = [];

  while (retries < maxRetries) {
    try {
      const events = await CONTRACT.getPastEvents(eventName, { fromBlock, toBlock });
      for (const DATA of events) {
        EVENT_ARRAY.push(DATA);
      }
      break;
    } catch (error) {
      if (isError(error) && isCupsErr(error)) {
        await randomDelay();
      } else {
        const errorString = (error as Error).toString();
        if (errorString.includes('Log response size exceeded.')) {
          const matchResult = errorString.match(/\[.*\]/g);
          if (matchResult) {
            const recommendedBlockRange = matchResult[0];
            const [start, end] = recommendedBlockRange
              .slice(1, -1)
              .split(', ')
              .map((x: string) => parseInt(x, 16));
            return { start, end };
          }
        }
        throw error;
      }
    }

    retries++;

    if (EVENT_ARRAY.length === 0) {
      await delay();
    }
  }

  return EVENT_ARRAY;
}

interface BlockNumber {
  block: string | number;
}

export async function web3Call(
  CONTRACT: Contract,
  method: string,
  params: any[],
  blockNumber: BlockNumber | number = { block: 'latest' }
): Promise<any> {
  let shouldContinue = true;
  let retries = 0;
  while (shouldContinue && retries < 12) {
    try {
      return await CONTRACT.methods[method](...params).call(blockNumber);
    } catch (error) {
      if (isError(error) && !isCupsErr(error)) {
        console.log(
          `${error} | Contract: ${CONTRACT.options.address} | method: ${method} | params: ${params} | blockNumber: ${blockNumber}`
        );
        shouldContinue = false;
      } else {
        await randomDelay();
      }
    }
    retries++;
    if (shouldContinue) {
      await delay();
    }
  }
}

export async function getBlockTimeStamp(blockNumber: number): Promise<number> {
  const BLOCK = await web3HttpProvider.eth.getBlock(blockNumber);
  return Number(BLOCK.timestamp);
}

export async function subscribeToEvents(CONTRACT: any, eventEmitter: EventEmitter, Market: any) {
  try {
    const subscription = CONTRACT.events.allEvents();

    subscription
      .on('connected', () => {
        console.log(CONTRACT._address, `subscribed to events successfully`);
      })
      .on('data', async (eventData: any) => {
        eventEmitter.emit('newEvent', { eventData, Market });
      })
      .on('error', (error: Error) => {
        console.error('Error in event subscription: ', error);
      });
  } catch (err: any) {
    console.log('Error in fetching events:', err.message);
  }
}

export async function subscribeToPegkeeperEvents(CONTRACT: any, eventEmitter: EventEmitter) {
  try {
    const subscription = CONTRACT.events.allEvents();

    subscription
      .on('connected', () => {
        console.log(CONTRACT._address, `subscribed to events successfully`);
      })
      .on('data', async (eventData: any) => {
        eventEmitter.emit('newPegKeeperEvent', eventData);
      })
      .on('error', (error: Error) => {
        console.error('Error in event subscription: ', error);
      });
  } catch (err: any) {
    console.log('Error in fetching events:', err.message);
  }
}

export async function subscribeToLendingMarketsEvents(
  market: EnrichedLendingMarketEvent,
  vaultContract: any,
  vaultAddress: string,
  vaultABI: any,
  controllerContact: any,
  controllerAddress: string,
  controllerABI: any,
  ammContract: any,
  ammAddress: string,
  ammABI: any,
  eventEmitter: EventEmitter,
  type: 'Vault' | 'Controller' | 'Amm'
) {
  let contract: any;
  let address: string;
  let abi: any;
  if (type === 'Vault') {
    contract = vaultContract;
    address = vaultAddress;
    abi = vaultABI;
  } else if (type === 'Controller') {
    contract = controllerContact;
    address = controllerAddress;
    abi = controllerABI;
  } else {
    contract = ammContract;
    address = ammAddress;
    abi = ammABI;
  }

  try {
    registerHandler(async (logs) => {
      const events = await fetchEventsRealTime(logs, address, abi, 'AllEvents');
      if (events.length > 0) {
        events.forEach((event: any) => {
          console.log('LLAMMA LEND Event', event.transactionHash);
          eventEmitter.emit('newLendingMarketsEvent', {
            market,
            event,
            type,
            vaultContract,
            controllerContact,
            ammContract,
          });
        });
      }
    });
  } catch (err) {
    console.log('Error in fetching events:', err);
  }
}

export async function getTxFromTxHash(txHash: string): Promise<any | null> {
  try {
    const TX = await web3HttpProvider.eth.getTransaction(txHash);
    return TX;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function getWalletTokenBalance(walletAddress: string, tokenAddress: string, blockNumber: number) {
  const ABI_BALANCE_OF: any[] = [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'balanceOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ];
  const TOKEN = new web3HttpProvider.eth.Contract(ABI_BALANCE_OF, tokenAddress);
  const BALANCE = await web3Call(TOKEN, 'balanceOf', [walletAddress], blockNumber);
  return BALANCE;
}

export async function getTxReceiptClassic(txHash: string): Promise<TransactionReceipt | null> {
  try {
    let txReceipt = await web3HttpProvider.eth.getTransactionReceipt(txHash);
    return txReceipt;
  } catch (error: any) {
    console.error(`Failed to fetch transaction receipt for hash: ${txHash}. Error: ${error.message}`);
    return null;
  }
}
