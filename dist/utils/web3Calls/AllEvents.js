import { web3HttpProvider } from './Web3Basics.js';
const handlers = [];
export function registerHandler(handler) {
    handlers.push(handler);
}
export async function startListeningToAllEvents(eventEmitter) {
    const currentBlock = await web3HttpProvider.eth.getBlockNumber();
    await getLogsForBlock(currentBlock);
    let lastBlockNumber = currentBlock;
    while (true) {
        await new Promise((resolve) => setTimeout(resolve, 8000));
        try {
            const currentBlock = await web3HttpProvider.eth.getBlockNumber();
            if (currentBlock > lastBlockNumber) {
                await getLogsForBlock(currentBlock);
                lastBlockNumber = currentBlock;
            }
        }
        catch (err) {
            console.error('Error getting block number:');
        }
    }
    async function getLogsForBlock(blockNumber) {
        const params = {
            fromBlock: blockNumber,
            toBlock: blockNumber,
        };
        try {
            const logs = await web3HttpProvider.eth.getPastLogs(params);
            console.log(`Number of logs for block ${blockNumber}: ${logs.length}`);
            // eventEmitter.emit('newEventLogs', logs);
            handlers.forEach((handler) => handler(logs));
        }
        catch (err) {
            console.error(`Error getting logs for block ${blockNumber}:`);
        }
    }
}
export async function fetchEventsRealTime(evmEventLogs, contractAddress, abi, eventName) {
    // Find event ABI
    const eventAbi = abi.find((item) => item.type === 'event' && item.name === eventName);
    if (!eventAbi) {
        throw new Error(`Event ${eventName} not found in ABI`);
    }
    // Compute event signature (topics[0])
    const eventSignature = web3HttpProvider.eth.abi.encodeEventSignature(eventAbi);
    // Filter logs that match the contract address & event signature
    const filteredLogs = evmEventLogs.filter((log) => log.address.toLowerCase() === contractAddress.toLowerCase() && log.topics[0] === eventSignature);
    // Decode logs and format output
    const formattedEvents = filteredLogs.map((log) => {
        const decoded = web3HttpProvider.eth.abi.decodeLog(eventAbi.inputs, log.data, log.topics.slice(1));
        // Remove numeric indices and __length__ from decoded object
        const returnValues = Object.entries(decoded)
            .filter(([key]) => isNaN(Number(key)) && key !== '__length__')
            .reduce((obj, [key, value]) => (Object.assign(Object.assign({}, obj), { [key]: value })), {});
        return {
            address: log.address,
            event: eventName,
            returnValues,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            transactionIndex: log.transactionIndex,
            blockHash: log.blockHash,
            logIndex: log.logIndex,
            removed: log.removed,
        };
    });
    return formattedEvents;
}
//# sourceMappingURL=AllEvents.js.map