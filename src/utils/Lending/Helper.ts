import { dir } from 'console';
import { EnrichedLendingMarketEvent, EthereumEvent, LendingMarketEvent, TransactionReceipt } from '../Interfaces.js';
import { web3HttpProvider } from '../../web3/Web3Basics.js';
import { getCoinDecimals, getCoinSymbol } from '../pegkeeper/Pegkeeper.js';
import { ABI_LLAMALEND_AMM } from './Abis.js';
import { web3Call } from '../../web3/generic.js';

export function extractParsedBorrowTokenAmountSentByBotFromReceiptForHardLiquidation(
  receipt: TransactionReceipt | null,
  market: EnrichedLendingMarketEvent
): number | null {
  if (!receipt) return null;
  const transferSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const controllerAddress = market.controller.toLowerCase().replace('0x', '');
  const ammAddress = market.amm.toLowerCase().replace('0x', '');

  const allLogsWithControllerAddress = receipt.logs.filter(
    (log) =>
      log.topics[0] === transferSignature &&
      log.topics[2].toLowerCase().replace('0x000000000000000000000000', '') === controllerAddress
  );

  console.log('allLogsWithControllerAddress', allLogsWithControllerAddress);

  let logEntry = allLogsWithControllerAddress.find(
    (log) => log.topics[1].toLowerCase().replace('0x000000000000000000000000', '') !== ammAddress
  );

  if (
    !logEntry &&
    allLogsWithControllerAddress.length === 1 &&
    allLogsWithControllerAddress[0].topics[1].toLowerCase().replace('0x000000000000000000000000', '') === ammAddress
  ) {
    logEntry = allLogsWithControllerAddress[0];
  }

  if (logEntry) {
    const hexValue = logEntry.data;
    const relevantHexValue = hexValue.slice(2);
    const decimalValue = parseInt(relevantHexValue, 16);
    return decimalValue / 10 ** market.borrowed_token_decimals;
  } else {
    console.log('No matching log entry found.');
    return null;
  }
}

export function filterForOnly(targetAddress: string, market: LendingMarketEvent): boolean {
  const normalizedTargetAddress = targetAddress.toLowerCase();
  const marketValues = Object.values(market);
  return marketValues.some((value) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === normalizedTargetAddress;
    }
    return false;
  });
}

export async function handleEvent(event: EthereumEvent): Promise<LendingMarketEvent> {
  const { id, collateral_token, borrowed_token, vault, controller, amm, price_oracle, monetary_policy } =
    event.returnValues;

  const lendingMarketEvent: LendingMarketEvent = {
    id,
    collateral_token,
    borrowed_token,
    vault,
    controller,
    amm,
    price_oracle,
    monetary_policy,
  };

  return lendingMarketEvent;
}

function buildMarketName(collateralTokenSymbol: string, borrowedTokenSymbol: string): string {
  let token;
  if (collateralTokenSymbol !== 'crvUSD') {
    return collateralTokenSymbol + ' Long';
  } else {
    return borrowedTokenSymbol + ' Short';
  }
}

export async function enrichMarketData(
  allLendingMarkets: LendingMarketEvent[]
): Promise<EnrichedLendingMarketEvent[] | null> {
  const enrichedMarkets: EnrichedLendingMarketEvent[] = [];

  for (const market of allLendingMarkets) {
    const collateralTokenSymbol = await getCoinSymbol(market.collateral_token, web3HttpProvider);
    const collateralTokenDecimals = await getCoinDecimals(market.collateral_token, web3HttpProvider);
    const borrowedTokenSymbol = await getCoinSymbol(market.borrowed_token, web3HttpProvider);
    const borrowedTokenDecimals = await getCoinDecimals(market.borrowed_token, web3HttpProvider);

    const ammContract = new web3HttpProvider.eth.Contract(ABI_LLAMALEND_AMM, market.amm);
    let fee = await web3Call(ammContract, 'fee', []);

    // Check if any fetched data is null
    if (!collateralTokenSymbol || !borrowedTokenSymbol || !collateralTokenDecimals || !borrowedTokenDecimals || !fee) {
      return null; // Return null for the whole function if any data couldn't be fetched
    }

    fee = fee / 1e18;

    // Assuming decimals are returned as strings and need to be parsed
    const collateralDecimals = parseInt(collateralTokenDecimals, 10);
    const borrowedDecimals = parseInt(borrowedTokenDecimals, 10);

    const marketName = buildMarketName(collateralTokenSymbol, borrowedTokenSymbol);

    enrichedMarkets.push({
      ...market,
      collateral_token_symbol: collateralTokenSymbol,
      collateral_token_decimals: collateralDecimals,
      borrowed_token_symbol: borrowedTokenSymbol,
      borrowed_token_decimals: borrowedDecimals,
      market_name: marketName,
      fee: fee,
    });
  }

  return enrichedMarkets;
}
