import { getRawTokens } from "./tokens.js";
import { getWeb3HttpProvider } from "../helperFunctions/Web3.js";
import { web3Call } from "../web3Calls/generic.js";
import { ADDRESS_PRICE_ORACLE_sfrxETH, ADDRESS_TRICRYPTO, ADDRESS_crvUSD_CONTROLLER, ADDRESS_crvUSD_PRICE_AGGREGATOR_2nd } from "../Constants.js";
import { ABI_Controller } from "../abis/ABI_Controller.js";
import { ABI_priceAggregator } from "../abis/ABI_PriceAggregator.js";
import { ABI_priceOracle } from "../abis/ABI_PriceOracle.js";
import { ABI_Tricrypto } from "../abis/ABI_Tricrypto.js";
import { getCurrentTokenPriceFromDefiLlama } from "../../txValue/DefiLlama.js";
const rawTokens = getRawTokens();
const tokens = rawTokens;
async function getPriceOf_ETH(blockNumber) {
    let web3 = getWeb3HttpProvider();
    const TRICRYPTO = new web3.eth.Contract(ABI_Tricrypto, ADDRESS_TRICRYPTO);
    try {
        return (await TRICRYPTO.methods.price_oracle(1).call(blockNumber)) / 1e18;
    }
    catch (error) {
        return null;
    }
}
export async function getPriceOf_sfrxETH(blockNumber) {
    let web3 = getWeb3HttpProvider();
    const PRICE_ORACLE = new web3.eth.Contract(ABI_priceOracle, ADDRESS_PRICE_ORACLE_sfrxETH);
    try {
        return (await PRICE_ORACLE.methods.price().call(blockNumber)) / 1e18;
    }
    catch (error) {
        return null;
    }
}
export async function getPriceOf_WETH(blockNumber) {
    return await getPriceOf_ETH(blockNumber);
}
export async function getPriceOf_frxETH(blockNumber) {
    return await getPriceOf_ETH(blockNumber);
}
export async function getPriceOf_crvUSD(blockNumber) {
    // let web3 = getWeb3HttpProvider();
    // const PRICE_AGGREGATOR = new web3.eth.Contract(ABI_priceAggregator, ADDRESS_crvUSD_PRICE_AGGREGATOR);
    // try {
    //   return (await PRICE_AGGREGATOR.methods.price().call(blockNumber)) / 1e18;
    // } catch (error) {
    //   console.log(error);
    //   return null;
    // }
    return getCurrentTokenPriceFromDefiLlama("0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E");
}
export async function getPriceOf_crvUSD_2nd(blockNumber) {
    let web3 = getWeb3HttpProvider();
    const PRICE_AGGREGATOR = new web3.eth.Contract(ABI_priceAggregator, ADDRESS_crvUSD_PRICE_AGGREGATOR_2nd);
    try {
        return (await PRICE_AGGREGATOR.methods.price().call(blockNumber)) / 1e18;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}
export async function getPriceOf_wstETH(blockNumber) {
    const WEB3_HTTP_PROVIDER = getWeb3HttpProvider();
    const CONTROLLER = new WEB3_HTTP_PROVIDER.eth.Contract(ABI_Controller, ADDRESS_crvUSD_CONTROLLER);
    const PRICE = await web3Call(CONTROLLER, "amm_price", [], blockNumber);
    const COLLAT_DECIMALS = 18;
    try {
        return Number(PRICE / 10 ** COLLAT_DECIMALS);
    }
    catch (error) {
        return null;
    }
}
export async function getPriceOf_USDT(blockNumber) {
    return 1;
}
export async function getPriceOf_USDC(blockNumber) {
    return 1;
}
const tokenGetPriceFunctions = {
    getPriceOf_ETH: getPriceOf_ETH,
    getPriceOf_WETH: getPriceOf_WETH,
    getPriceOf_frxETH: getPriceOf_frxETH,
    getPriceOf_crvUSD: getPriceOf_crvUSD,
    getPriceOf_USDT: getPriceOf_USDT,
    getPriceOf_USDC: getPriceOf_USDC,
    getPriceOf_sfrxETH: getPriceOf_sfrxETH,
    getPriceOf_wstETH: getPriceOf_wstETH,
};
const tokenPriceFunctions = {};
Object.keys(tokens).forEach((tokenName) => {
    const functionName = `getPriceOf_${tokenName}`;
    if (tokenGetPriceFunctions[functionName]) {
        tokenPriceFunctions[functionName] = tokenGetPriceFunctions[functionName];
    }
});
export async function getPrice(address, blockNumber) {
    const lowercasedAddress = address.toLowerCase();
    let tokenName = Object.keys(tokens).find((key) => tokens[key].toLowerCase() === lowercasedAddress.toLowerCase());
    if (tokenName) {
        const functionName = `getPriceOf_${tokenName}`;
        return await tokenPriceFunctions[functionName](blockNumber);
    }
    console.log(`token ${address} not saved in priceAPI`);
    return null; // handle the case when the address is not found
}
//# sourceMappingURL=priceAPI.js.map