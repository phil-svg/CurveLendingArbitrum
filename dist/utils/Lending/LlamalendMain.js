import { LENDING_MIN_LIQUIDATION_DISCOUNT_WORTH_PRINTING, LENDING_MIN_LOAN_CHANGE_AMOUNT_WORTH_PRINTING, } from '../../LendingArbitrumBot.js';
import { getBorrowApr, getCollatDollarValue, getLendApr, getPositionHealth, getTotalAssets, getTotalDebtInMarket, } from '../helperFunctions/Lending.js';
import { web3HttpProvider, webWsProvider } from '../helperFunctions/Web3.js';
import { getPriceOf_crvUSD } from '../priceAPI/priceAPI.js';
import { buildLendingMarketBorrowMessage, buildLendingMarketDepositMessage, buildLendingMarketHardLiquidateMessage, buildLendingMarketRemoveCollateralMessage, buildLendingMarketRepayMessage, buildLendingMarketSelfLiquidateMessage, buildLendingMarketWithdrawMessage, buildSoftLiquidateMessage, } from '../telegram/TelegramBot.js';
import { checkWsConnectionViaNewBlocks, getCurrentBlockNumber, getPastEvents, getTxReceiptClassic, subscribeToLendingMarketsEvents, } from '../web3Calls/generic.js';
import { ABI_LLAMALEND_AMM, ABI_LLAMALEND_CONTROLLER, ABI_LLAMALEND_FACTORY, ABI_LLAMALEND_VAULT } from './Abis.js';
import { enrichMarketData, extractParsedBorrowTokenAmountSentByBotFromReceiptForHardLiquidation, handleEvent, } from './Helper.js';
async function processLlamalendVaultEvent(market, llamalendVaultContract, controllerContract, ammContract, event, eventEmitter) {
    const txHash = event.transactionHash;
    const isLongPosition = market.market_name.endsWith('Long');
    let crvUSDPrice = await getPriceOf_crvUSD(event.blockNumber);
    if (!crvUSDPrice)
        return;
    const otherTokenDollarValue = await getCollatDollarValue(market, ammContract, event.blockNumber);
    let borrowedTokenDollarPricePerUnit = 0;
    if (isLongPosition) {
        borrowedTokenDollarPricePerUnit = crvUSDPrice;
    }
    else {
        borrowedTokenDollarPricePerUnit = otherTokenDollarValue;
    }
    if (event.event === 'Deposit') {
        const agentAddress = event.returnValues.sender;
        const parsedDepositedBorrowTokenAmount = event.returnValues.assets / 10 ** Number(market.borrowed_token_decimals);
        const borrowApr = await getBorrowApr(llamalendVaultContract, event.blockNumber);
        const lendApr = await getLendApr(llamalendVaultContract, event.blockNumber);
        const totalAssets = await getTotalAssets(market, llamalendVaultContract, event.blockNumber);
        const totalDebtInMarket = await getTotalDebtInMarket(market, controllerContract, event.blockNumber);
        const dollarAmount = parsedDepositedBorrowTokenAmount * borrowedTokenDollarPricePerUnit;
        if (dollarAmount < LENDING_MIN_LOAN_CHANGE_AMOUNT_WORTH_PRINTING)
            return;
        const message = buildLendingMarketDepositMessage(market, txHash, dollarAmount, agentAddress, parsedDepositedBorrowTokenAmount, borrowApr, lendApr, totalAssets, totalDebtInMarket);
        eventEmitter.emit('newMessage', message);
    }
    if (event.event === 'Withdraw') {
        const agentAddress = event.returnValues.sender;
        const parsedWithdrawnBorrowTokenAmount = event.returnValues.assets / 10 ** Number(market.borrowed_token_decimals);
        const borrowApr = await getBorrowApr(llamalendVaultContract, event.blockNumber);
        const lendApr = await getLendApr(llamalendVaultContract, event.blockNumber);
        const totalAssets = await getTotalAssets(market, llamalendVaultContract, event.blockNumber);
        const totalDebtInMarket = await getTotalDebtInMarket(market, controllerContract, event.blockNumber);
        const dollarAmount = parsedWithdrawnBorrowTokenAmount * borrowedTokenDollarPricePerUnit;
        if (dollarAmount < LENDING_MIN_LOAN_CHANGE_AMOUNT_WORTH_PRINTING)
            return;
        const message = buildLendingMarketWithdrawMessage(market, txHash, dollarAmount, agentAddress, parsedWithdrawnBorrowTokenAmount, borrowApr, lendApr, totalAssets, totalDebtInMarket);
        eventEmitter.emit('newMessage', message);
    }
}
async function processLlamalendControllerEvent(market, llamalendVaultContract, controllerContract, ammContract, event, eventEmitter) {
    if (!['Borrow', 'Repay', 'RemoveCollateral', 'Liquidate'].includes(event.event))
        return;
    const isLongPosition = market.market_name.endsWith('Long');
    let crvUSDPrice = await getPriceOf_crvUSD(event.blockNumber);
    if (!crvUSDPrice)
        return;
    const otherTokenDollarValue = await getCollatDollarValue(market, ammContract, event.blockNumber);
    let borrowedTokenDollarPricePerUnit = 0;
    let collatTokenDollarPricePerUnit = 0;
    if (isLongPosition) {
        collatTokenDollarPricePerUnit = otherTokenDollarValue;
        borrowedTokenDollarPricePerUnit = crvUSDPrice;
    }
    else {
        borrowedTokenDollarPricePerUnit = otherTokenDollarValue;
        collatTokenDollarPricePerUnit = crvUSDPrice;
    }
    const txHash = event.transactionHash;
    const agentAddress = event.returnValues.user;
    const positionHealth = await getPositionHealth(controllerContract, agentAddress, event.blockNumber);
    const totalDebtInMarket = await getTotalDebtInMarket(market, controllerContract, event.blockNumber);
    const borrowApr = await getBorrowApr(llamalendVaultContract, event.blockNumber);
    const lendApr = await getLendApr(llamalendVaultContract, event.blockNumber);
    const totalAssets = await getTotalAssets(market, llamalendVaultContract, event.blockNumber);
    if (event.event === 'Borrow') {
        const parsedBorrowedAmount = event.returnValues.loan_increase / 10 ** Number(market.borrowed_token_decimals);
        const parsedCollatAmount = event.returnValues.collateral_increase / 10 ** Number(market.collateral_token_decimals);
        const collatDollarAmount = collatTokenDollarPricePerUnit * parsedCollatAmount;
        const dollarAmountBorrow = parsedBorrowedAmount * borrowedTokenDollarPricePerUnit;
        if (dollarAmountBorrow < LENDING_MIN_LOAN_CHANGE_AMOUNT_WORTH_PRINTING)
            return;
        const message = buildLendingMarketBorrowMessage(market, txHash, agentAddress, parsedBorrowedAmount, parsedCollatAmount, positionHealth, totalDebtInMarket, collatDollarAmount, dollarAmountBorrow, borrowApr, lendApr, totalAssets);
        eventEmitter.emit('newMessage', message);
    }
    if (event.event === 'Repay') {
        const parsedRepayAmount = event.returnValues.loan_decrease / 10 ** Number(market.borrowed_token_decimals);
        const parsedCollatAmount = event.returnValues.collateral_decrease / 10 ** Number(market.collateral_token_decimals);
        const collatDollarAmount = collatTokenDollarPricePerUnit * parsedCollatAmount;
        const repayDollarAmount = parsedRepayAmount * borrowedTokenDollarPricePerUnit;
        if (repayDollarAmount < LENDING_MIN_LOAN_CHANGE_AMOUNT_WORTH_PRINTING)
            return;
        const message = buildLendingMarketRepayMessage(market, txHash, positionHealth, totalDebtInMarket, agentAddress, parsedRepayAmount, collatDollarAmount, parsedCollatAmount, repayDollarAmount, borrowApr, lendApr, totalAssets);
        eventEmitter.emit('newMessage', message);
    }
    if (event.event === 'RemoveCollateral') {
        const parsedCollatAmount = event.returnValues.collateral_decrease / 10 ** Number(market.collateral_token_decimals);
        const collatDollarAmount = collatTokenDollarPricePerUnit * parsedCollatAmount;
        if (collatDollarAmount < LENDING_MIN_LOAN_CHANGE_AMOUNT_WORTH_PRINTING)
            return;
        const message = buildLendingMarketRemoveCollateralMessage(market, parsedCollatAmount, txHash, agentAddress, positionHealth, collatDollarAmount, totalDebtInMarket, borrowApr, lendApr, totalAssets);
        eventEmitter.emit('newMessage', message);
    }
    // HARD-LIQUIDATION
    if (event.event === 'Liquidate') {
        const receipt = await getTxReceiptClassic(txHash);
        let parsedBorrowTokenAmountSentByBotFromReceiptForHardLiquidation = extractParsedBorrowTokenAmountSentByBotFromReceiptForHardLiquidation(receipt, market);
        if (!parsedBorrowTokenAmountSentByBotFromReceiptForHardLiquidation) {
            parsedBorrowTokenAmountSentByBotFromReceiptForHardLiquidation = 0;
        }
        const borrowTokenDollarAmount = parsedBorrowTokenAmountSentByBotFromReceiptForHardLiquidation * borrowedTokenDollarPricePerUnit;
        const liquidatorAddress = event.returnValues.liquidator;
        const poorFellaAddress = event.returnValues.user;
        const parsedCollatAmount = event.returnValues.collateral_received / 10 ** market.collateral_token_decimals;
        const collarDollarValue = parsedCollatAmount * collatTokenDollarPricePerUnit;
        const discountAmount = Math.abs(collarDollarValue - borrowTokenDollarAmount);
        if (discountAmount < LENDING_MIN_LIQUIDATION_DISCOUNT_WORTH_PRINTING)
            return;
        if (poorFellaAddress.toLowerCase() === liquidatorAddress.toLowerCase()) {
            const message = buildLendingMarketSelfLiquidateMessage(market, parsedBorrowTokenAmountSentByBotFromReceiptForHardLiquidation, borrowTokenDollarAmount, parsedCollatAmount, collarDollarValue, txHash, totalDebtInMarket, borrowApr, lendApr, totalAssets, liquidatorAddress);
            eventEmitter.emit('newMessage', message);
        }
        else {
            const message = buildLendingMarketHardLiquidateMessage(market, parsedBorrowTokenAmountSentByBotFromReceiptForHardLiquidation, borrowTokenDollarAmount, parsedCollatAmount, collarDollarValue, txHash, totalDebtInMarket, borrowApr, lendApr, totalAssets, liquidatorAddress, poorFellaAddress);
            if (message != `don't print tiny hard-liquidations`)
                eventEmitter.emit('newMessage', message);
        }
    }
}
async function processLlamalendAmmEvent(market, llamalendVaultContract, controllerContract, ammContract, event, eventEmitter) {
    if (event.event === 'TokenExchange') {
        console.log('Soft Liquidation spotted');
        console.log('\n\n new Event in LLAMMA_CRVUSD_AMM:', event);
        const isLongPosition = market.market_name.endsWith('Long');
        let crvUSDPrice = await getPriceOf_crvUSD(event.blockNumber);
        if (!crvUSDPrice)
            return;
        const otherTokenDollarValue = await getCollatDollarValue(market, ammContract, event.blockNumber);
        let borrowedTokenDollarPricePerUnit = 0;
        let collatTokenDollarPricePerUnit = 0;
        if (isLongPosition) {
            collatTokenDollarPricePerUnit = otherTokenDollarValue;
            borrowedTokenDollarPricePerUnit = crvUSDPrice;
        }
        else {
            borrowedTokenDollarPricePerUnit = otherTokenDollarValue;
            collatTokenDollarPricePerUnit = crvUSDPrice;
        }
        const txHash = event.transactionHash;
        const agentAddress = event.returnValues.buyer;
        let parsedSoftLiquidatedAmount;
        let parsedRepaidAmount;
        if (event.returnValues.sold_id === '0') {
            parsedSoftLiquidatedAmount = event.returnValues.tokens_bought / 10 ** market.collateral_token_decimals;
            parsedRepaidAmount = event.returnValues.tokens_sold / 10 ** market.borrowed_token_decimals;
        }
        else {
            parsedSoftLiquidatedAmount = event.returnValues.tokens_sold / 10 ** market.collateral_token_decimals;
            parsedRepaidAmount = event.returnValues.tokens_bought / 10 ** market.borrowed_token_decimals;
        }
        const collatDollarAmount = collatTokenDollarPricePerUnit * parsedSoftLiquidatedAmount;
        const repaidBorrrowTokenDollarAmount = parsedRepaidAmount * borrowedTokenDollarPricePerUnit;
        const discountAmount = repaidBorrrowTokenDollarAmount * market.fee;
        if (discountAmount < LENDING_MIN_LIQUIDATION_DISCOUNT_WORTH_PRINTING)
            return;
        const totalDebtInMarket = await getTotalDebtInMarket(market, controllerContract, event.blockNumber);
        const borrowApr = await getBorrowApr(llamalendVaultContract, event.blockNumber);
        const lendApr = await getLendApr(llamalendVaultContract, event.blockNumber);
        const totalAssets = await getTotalAssets(market, llamalendVaultContract, event.blockNumber);
        const message = buildSoftLiquidateMessage(market, txHash, agentAddress, parsedSoftLiquidatedAmount, collatDollarAmount, parsedRepaidAmount, repaidBorrrowTokenDollarAmount, borrowApr, lendApr, totalDebtInMarket, totalAssets, discountAmount);
        eventEmitter.emit('newMessage', message);
    }
}
async function getAllLendingMarkets() {
    const LENDING_LAUNCH_BLOCK = 193652535; // arbitrum
    const PRESENT = await getCurrentBlockNumber();
    const llamalendFactory = new web3HttpProvider.eth.Contract(ABI_LLAMALEND_FACTORY, llamalendFactoryAddress);
    const result = await getPastEvents(llamalendFactory, 'NewVault', LENDING_LAUNCH_BLOCK, PRESENT);
    let events = [];
    if (Array.isArray(result)) {
        events = result;
    }
    else {
        return [];
    }
    const lendingMarkets = await Promise.all(events.map((event) => handleEvent(event)));
    lendingMarkets.sort((a, b) => a.id.localeCompare(b.id));
    return lendingMarkets;
}
async function histoMode(allLendingMarkets, eventEmitter) {
    const LENDING_LAUNCH_BLOCK = 193652535; // arbitrum
    const PRESENT = await getCurrentBlockNumber();
    // const START_BLOCK = LENDING_LAUNCH_BLOCK;
    // const END_BLOCK = PRESENT;
    const START_BLOCK = 238513569;
    const END_BLOCK = START_BLOCK;
    console.log('start');
    for (const market of allLendingMarkets) {
        // used to filter for only 1 market to speed up debugging, works for address of vault, controller, or amm
        // if (!filterForOnly("0x52096539ed1391CB50C6b9e4Fd18aFd2438ED23b", market)) continue;
        // console.log("\nmarket", market);
        const vaultContract = new web3HttpProvider.eth.Contract(ABI_LLAMALEND_VAULT, market.vault);
        const controllerContact = new web3HttpProvider.eth.Contract(ABI_LLAMALEND_CONTROLLER, market.controller);
        const ammContract = new web3HttpProvider.eth.Contract(ABI_LLAMALEND_AMM, market.amm);
        const pastEventsVault = await getPastEvents(vaultContract, 'allEvents', START_BLOCK, END_BLOCK);
        if (Array.isArray(pastEventsVault)) {
            for (const event of pastEventsVault) {
                await processLlamalendVaultEvent(market, vaultContract, controllerContact, ammContract, event, eventEmitter);
                console.log('\n\n new Event in Vault:', event);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }
        const pastEventsController = await getPastEvents(controllerContact, 'allEvents', START_BLOCK, END_BLOCK);
        if (Array.isArray(pastEventsController)) {
            for (const event of pastEventsController) {
                console.log('\n\n new Event in Controller:', event);
                await processLlamalendControllerEvent(market, vaultContract, controllerContact, ammContract, event, eventEmitter);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }
        const pastEventsAmm = await getPastEvents(ammContract, 'allEvents', START_BLOCK, END_BLOCK);
        if (Array.isArray(pastEventsAmm)) {
            for (const event of pastEventsAmm) {
                console.log('\n\n new Event in Amm:', event);
                await processLlamalendAmmEvent(market, vaultContract, controllerContact, ammContract, event, eventEmitter);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }
    }
    console.log('done');
    await new Promise((resolve) => setTimeout(resolve, 500));
    process.exit();
}
async function liveMode(allLendingMarkets, eventEmitter) {
    await checkWsConnectionViaNewBlocks();
    for (const market of allLendingMarkets) {
        console.log('\nmarket', market);
        const vaultContract = new webWsProvider.eth.Contract(ABI_LLAMALEND_VAULT, market.vault);
        const controllerContact = new webWsProvider.eth.Contract(ABI_LLAMALEND_CONTROLLER, market.controller);
        const ammContract = new webWsProvider.eth.Contract(ABI_LLAMALEND_AMM, market.amm);
        subscribeToLendingMarketsEvents(market, vaultContract, controllerContact, ammContract, eventEmitter, 'Vault');
        subscribeToLendingMarketsEvents(market, vaultContract, controllerContact, ammContract, eventEmitter, 'Controller');
        subscribeToLendingMarketsEvents(market, vaultContract, controllerContact, ammContract, eventEmitter, 'Amm');
    }
    eventEmitter.on('newLendingMarketsEvent', async ({ market, event, type, vaultContract, controllerContact, ammContract }) => {
        console.log('\nnew event in Market:', market.vault, ':', event, 'type:', type);
        if (type === 'Vault') {
            await processLlamalendVaultEvent(market, vaultContract, controllerContact, ammContract, event, eventEmitter);
        }
        else if (type === 'Controller') {
            await processLlamalendControllerEvent(market, vaultContract, controllerContact, ammContract, event, eventEmitter);
        }
        else if (type === 'Amm') {
            await processLlamalendAmmEvent(market, vaultContract, controllerContact, ammContract, event, eventEmitter);
        }
    });
}
// Markets: (v3)
const llamalendFactoryAddress = '0xcaEC110C784c9DF37240a8Ce096D352A75922DeA'; // arbitrum
// todo
export async function launchCurveLendingMonitoring(eventEmitter) {
    const allLendingMarkets = await getAllLendingMarkets();
    const allEnrichedLendingMarkets = await enrichMarketData(allLendingMarkets);
    if (!allEnrichedLendingMarkets) {
        console.log('Failed to boot LLamma Lend Markets, stopping!');
        return;
    }
    // console.log("allEnrichedLendingMarkets", allEnrichedLendingMarkets);
    // process.exit();
    // await histoMode(allEnrichedLendingMarkets, eventEmitter);
    await liveMode(allEnrichedLendingMarkets, eventEmitter);
}
/*

allEnrichedLendingMarkets [
  {
    id: '0',
    collateral_token: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    borrowed_token: '0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5',
    vault: '0x49014A8eB1585cBee6A7a9A50C3b81017BF6Cc4d',
    controller: '0xB5B6f0E69c283AA32425FA18220e64283B51F0A4',
    amm: '0x38EB8Af29A75eAdf91A3E702B73244d0Eb1F2bF2',
    price_oracle: '0x4B24b02d165157Fa5F5f4975499da97C83E4cd26',
    monetary_policy: '0xEB9c27A490eDE4f82c05d320FA741989048BD597',
    collateral_token_symbol: 'WETH',
    collateral_token_decimals: 18,
    borrowed_token_symbol: 'crvUSD',
    borrowed_token_decimals: 18,
    market_name: 'WETH Long',
    fee: 0.006
  },
  {
    id: '1',
    collateral_token: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    borrowed_token: '0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5',
    vault: '0x60D38b12d22BF423F28082bf396ff8F28cC506B1',
    controller: '0x013be86e1cdb0f384dAF24Bd974FE75EdFfe6B68',
    amm: '0x12D1c9434aFC60f65EEe4431b185e01a11355Db0',
    price_oracle: '0x772dc33c94132864263a43bfb1ab14e68f716188',
    monetary_policy: '0xEdbbD476893C7A938c14AAC27A05B0e98C8a68F7',
    collateral_token_symbol: 'WBTC',
    collateral_token_decimals: 8,
    borrowed_token_symbol: 'crvUSD',
    borrowed_token_decimals: 18,
    market_name: 'WBTC Long',
    fee: 0.006
  },
  {
    id: '2',
    collateral_token: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    borrowed_token: '0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5',
    vault: '0xB50409Dd4D5B418042ab4DCee6a2FA7D1FE2fcf8',
    controller: '0x28c20590de7539C316191F413686dcF794d8898E',
    amm: '0x772B6Fb77aD572161Cc535661439184453Ee5c41',
    price_oracle: '0x9B053d1C660c73a22c1fE5d7F9189Cf7D8fa46bd',
    monetary_policy: '0xBcAbDED2d23162d1e3351a9a713543E2CeE79559',
    collateral_token_symbol: 'WBTC',
    collateral_token_decimals: 8,
    borrowed_token_symbol: 'crvUSD',
    borrowed_token_decimals: 18,
    market_name: 'WBTC Long',
    fee: 0.005
  },
  {
    id: '3',
    collateral_token: '0x5f851F67D24419982EcD7b7765deFD64fBb50a97',
    borrowed_token: '0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5',
    vault: '0x7d622A3615B34abf84Ac255b8C8D1685ea3a433F',
    controller: '0x5014AB37Fca7201baDEc3C0d0f28Dc7899cdC7D5',
    amm: '0xD5E569B0020b5D30d44Eea5f8d328aAA4dB2FdFF',
    price_oracle: '0xd7e753478E2f3Fa9b7f1bEd19737691024299e85',
    monetary_policy: '0x7Ea0c2b62687FD16FDD2F2332f1475585B19A82c',
    collateral_token_symbol: 'gmUSDC',
    collateral_token_decimals: 6,
    borrowed_token_symbol: 'crvUSD',
    borrowed_token_decimals: 18,
    market_name: 'gmUSDC Long',
    fee: 0.002
  },
  {
    id: '4',
    collateral_token: '0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978',
    borrowed_token: '0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5',
    vault: '0xeEaF2ccB73A01deb38Eca2947d963D64CfDe6A32',
    controller: '0x88f88e937Db48bBfe8E3091718576430704e47Ab',
    amm: '0x742089D51DD708dE2C728aA7F3172f28fe419424',
    price_oracle: '0x20ee737f3BBA55D3EEE64B226dF47c575B6538C9',
    monetary_policy: '0x1F56Fb63e54F459a9b448D8feECd40AEf3D27B21',
    collateral_token_symbol: 'CRV',
    collateral_token_decimals: 18,
    borrowed_token_symbol: 'crvUSD',
    borrowed_token_decimals: 18,
    market_name: 'CRV Long',
    fee: 0.006
  },
  {
    id: '5',
    collateral_token: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    borrowed_token: '0x498Bf2B1e120FeD3ad3D42EA2165E9b73f99C1e5',
    vault: '0x65592b1F12c07D434e95c7BF87F4f2f464e950e4',
    controller: '0x76709bC0dA299Ab0234EEC51385E900922AE98f5',
    amm: '0x33e5ea2f7E7f050d1c2e981d659e37B2445aEE09',
    price_oracle: '0x6341D0C2d96C73666ab4B491c41dbcFA6F9e696C',
    monetary_policy: '0xc4fFBf2CeCeEf36BaDA8aA5054d77f770341eCA0',
    collateral_token_symbol: 'ARB',
    collateral_token_decimals: 18,
    borrowed_token_symbol: 'crvUSD',
    borrowed_token_decimals: 18,
    market_name: 'ARB Long',
    fee: 0.0015
  }
]

*/
//# sourceMappingURL=LlamalendMain.js.map