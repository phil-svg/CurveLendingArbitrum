import Web3 from 'web3';
import axios from 'axios';
import Bottleneck from 'bottleneck';
import axiosRetry from 'axios-retry';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export let web3HttpProvider = await getWeb3HttpProvider();
export let web3WsProvider = getWeb3WsProvider();

function getWeb3WsProvider(): Web3 {
  let web3WsProvider: Web3 | null = null;
  const wsProvider = new Web3.providers.WebsocketProvider(process.env.WEB_WS_MAINNET!);

  // Attach 'end' event listener
  wsProvider.on('end', (err?: Error) => {
    console.log('WS connection ended, reconnecting...', err);
    web3WsProvider = null; // Clear instance so that it can be recreated.
    getWeb3WsProvider(); // Recursive call to recreate the provider.
  });

  wsProvider.on('error', () => {
    console.error('WS encountered an error');
  });

  web3WsProvider = new Web3(wsProvider);

  return web3WsProvider;
}

async function getWeb3HttpProvider(): Promise<Web3> {
  let web3HttpProvider: Web3 | null = null;

  const MAX_RETRIES = 5; // Maximum number of retries
  const RETRY_DELAY = 5000; // Delay between retries in milliseconds
  let retries = 0;

  console.log('hi', process.env.WEB3_HTTP_MAINNET);

  while (retries < MAX_RETRIES) {
    try {
      web3HttpProvider = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_HTTP_MAINNET!));
      // await web3HttpProvider.eth.net.isListening(); // This will throw an error if it can't connect
      return web3HttpProvider;
    } catch (error: unknown) {
      if (error instanceof Error) {
        const err = error as any;
        if (err.code === 'ECONNABORTED') {
          console.log(
            `HTTP Provider connection timed out. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${
              RETRY_DELAY / 1000
            } seconds.`
          );
        } else if (err.message && err.message.includes('CONNECTION ERROR')) {
          console.log(
            `HTTP Provider connection error. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${
              RETRY_DELAY / 1000
            } seconds.`
          );
        } else {
          console.log(
            `Failed to connect to Node. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${
              RETRY_DELAY / 1000
            } seconds. ${err}`
          );
        }
        retries++;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw new Error(
    'Failed to connect to Node after several attempts. Please check your connection and the status of the Node.'
  );
}

export async function getTxReceipt(txHash: string): Promise<any> {
  try {
    const response = await axios.post(
      `${process.env.WEB3_HTTP!}`,
      {
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      },
      {
        timeout: 5000, // Set a timeout of 5000 milliseconds
      }
    );

    if (response.data && response.data.result) {
      return response.data.result;
    } else {
      return null;
    }
  } catch (error) {
    const err = error as Error & { code?: string };
    /*
    if (err.code !== "ECONNABORTED" && err.code !== "ERR_SOCKET_CONNECTION_TIMEOUT" && err.code !== "ERR_BAD_REQUEST") {
      // Don't log timeout errors
      console.error("Error fetching transaction receipt:", err);
    }
    */
    console.error('Error fetching transaction receipt:', err);
    return null;
  }
}

export async function getCallTraceViaRpcProvider(txHash: string): Promise<any> {
  const response = await fetch(process.env.WEB3_HTTP!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'trace_transaction',
      params: [txHash],
      id: 1,
      jsonrpc: '2.0',
    }),
  });

  if (response.status !== 200) {
    return 'request failed';
  }

  const data = (await response.json()) as { result: any };
  return data.result;
}

export async function getTxWithLimiter(txHash: string): Promise<any | null> {
  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 300,
  });

  axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
      return retryCount * 2000;
    },
    retryCondition: (error) => {
      return error.code === 'ECONNABORTED' || error.code === 'ERR_SOCKET_CONNECTION_TIMEOUT';
    },
  });

  return limiter.schedule(async () => {
    let retries = 0;
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 5000;

    while (retries < MAX_RETRIES) {
      try {
        const TX = await web3HttpProvider.eth.getTransaction(txHash);
        return TX;
      } catch (error: unknown) {
        if (error instanceof Error) {
          const err = error as any;
          if (err.code === 'ECONNABORTED') {
            console.log(
              `getTxWithLimiter connection timed out. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${
                RETRY_DELAY / 1000
              } seconds.`
            );
          } else if (err.message && err.message.includes('CONNECTION ERROR')) {
            console.log(
              `getTxWithLimiter connection error. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${
                RETRY_DELAY / 1000
              } seconds.`
            );
          } else {
            console.log(
              `Failed to get transaction by hash. Attempt ${retries + 1} of ${MAX_RETRIES}. Retrying in ${
                RETRY_DELAY / 1000
              } seconds.`
            );
          }
          retries++;
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    console.log(
      `Failed to get transaction by hash ${txHash} after several attempts. Please check your connection and the status of the Node.`
    );
    return null;
  });
}
