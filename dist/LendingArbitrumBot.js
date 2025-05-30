import { getCurrentBlockNumber, getPastEvents } from './web3/generic.js';
import { telegramBotMain } from './utils/telegram/TelegramBot.js';
import { EventEmitter } from 'events';
import { handleLiveEvents, manageMarket, watchingForNewMarketOpenings } from './utils/Oragnizer.js';
import { ADDRESS_crvUSD_ControllerFactory } from './utils/Constants.js';
import { livemodePegKeepers } from './utils/pegkeeper/Pegkeeper.js';
import { ABI_crvUSD_ControllerFactory } from './utils/abis/ABI_crvUSD_ControllerFactory.js';
import { launchCurveLendingMonitoring } from './utils/Lending/LlamalendMain.js';
import { startListeningToAllEvents } from './web3/AllEvents.js';
import { web3WsProvider } from './web3/Web3Basics.js';
console.clear();
// ********************* classic crvUSD **************
export const MIN_REPAYED_AMOUNT_WORTH_PRINTING = 100000;
export const MIN_LIQUIDATION_AMOUNT_WORTH_PRINTING = 65000;
export const MIN_HARDLIQ_AMOUNT_WORTH_PRINTING = 5000;
// export const MIN_REPAYED_AMOUNT_WORTH_PRINTING = 0;
// export const MIN_LIQUIDATION_AMOUNT_WORTH_PRINTING = 0;
// export const MIN_HARDLIQ_AMOUNT_WORTH_PRINTING = 0;
// ********************* Lending *********************
export const LENDING_MIN_LOAN_CHANGE_AMOUNT_WORTH_PRINTING = 100000;
export const LENDING_MIN_LIQUIDATION_DISCOUNT_WORTH_PRINTING = 15;
export const LENDING_MIN_HARDLIQ_AMOUNT_WORTH_PRINTING = 1000;
// export const LENDING_MIN_LOAN_CHANGE_AMOUNT_WORTH_PRINTING = 0;
// export const LENDING_MIN_LIQUIDATION_DISCOUNT_WORTH_PRINTING = 0;
// export const LENDING_MIN_HARDLIQ_AMOUNT_WORTH_PRINTING = 0.1;
// ***************************************************
const ENV = 'prod';
// const ENV = 'test';
const eventEmitter = new EventEmitter();
async function launchClassicCrvUSDMonitoring() {
    const crvUSD_ControllerFactory = new web3WsProvider.eth.Contract(ABI_crvUSD_ControllerFactory, ADDRESS_crvUSD_ControllerFactory);
    const crvUSD_LAUNCH_BLOCK = 17257955;
    const PRESENT = await getCurrentBlockNumber();
    await livemodePegKeepers(PRESENT, eventEmitter);
    // await pegkeeperHisto(eventEmitter, 19046609, 19096615);
    const ADDED_MARKET_EVENTS = await getPastEvents(crvUSD_ControllerFactory, 'AddMarket', crvUSD_LAUNCH_BLOCK, PRESENT);
    if (!(ADDED_MARKET_EVENTS instanceof Array))
        return;
    for (const MARKET_CREATION of ADDED_MARKET_EVENTS) {
        await manageMarket(MARKET_CREATION, eventEmitter);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    await watchingForNewMarketOpenings(crvUSD_ControllerFactory, eventEmitter);
    await handleLiveEvents(eventEmitter);
    console.log('crvUSD_Bot launched successfully.');
}
async function main() {
    await telegramBotMain(ENV, eventEmitter);
    startListeningToAllEvents();
    await launchCurveLendingMonitoring(eventEmitter);
}
await main();
// await conductResearch();
//# sourceMappingURL=LendingArbitrumBot.js.map