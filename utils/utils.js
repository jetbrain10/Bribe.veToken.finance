import BigNumber from "bignumber.js";

// todo: get navigator declared somehow? probably an issue with using nextjs
// function getLang() {
//  if (window.navigator.languages != undefined)
//   return window.navigator.languages[0];
//  else
//   return window.navigator.language;
// }

export function formatCurrency(amount, decimals = 2) {
  if (!isNaN(amount)) {

    if(BigNumber(amount).gt(0) && BigNumber(amount).lt(0.01)) {
      return '< 0.01'
    }

    const formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return formatter.format(amount);
  } else {
    return 0;
  }
}

export function formatAddress(address, length = "short") {
  if (address && length === "short") {
    address =
      address.substring(0, 6) +
      "..." +
      address.substring(address.length - 4, address.length);
    return address;
  } else if (address && length === "long") {
    address =
      address.substring(0, 12) +
      "..." +
      address.substring(address.length - 8, address.length);
    return address;
  } else {
    return null;
  }
}

export function bnDec(decimals) {
  return new BigNumber(10).pow(parseInt(decimals));
}

export function sqrt(value) {
  if (value < 0n) {
    throw new Error('square root of negative numbers is not supported')
  }

  if (value < 2n) {
    return value
  }

  function newtonIteration(n, x0) {
    // eslint-disable-next-line no-bitwise
    const x1 = (n / x0 + x0) >> 1n
    if (x0 === x1 || x0 === x1 - 1n) {
      return x0
    }
    return newtonIteration(n, x1)
  }

  return newtonIteration(value, 1n)
}

export function convertToInternationalCurrencySystem (labelValue) {

  // Nine Zeroes for Billions
  return Math.abs(Number(labelValue)) >= 1.0e+9

  ? (Math.abs(Number(labelValue)) / 1.0e+9).toFixed(2) + "B"
  // Six Zeroes for Millions 
  : Math.abs(Number(labelValue)) >= 1.0e+6

  ? (Math.abs(Number(labelValue)) / 1.0e+6).toFixed(2) + "M"
  // Three Zeroes for Thousands
  : Math.abs(Number(labelValue)) >= 1.0e+3

  ? (Math.abs(Number(labelValue)) / 1.0e+3).toFixed(2) + "K"

  : Math.abs(Number(labelValue)).toFixed(2);

}

export function convertToCurrencyWithSign(labelValue){
  return '$' + convertToInternationalCurrencySystem(labelValue)
}
export const tokenOracle= async (tokens)=>{
  const uniqueTokens = tokens.filter((v, index) => {
    return tokens.indexOf(v) === index;
})
  let url = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses='
  for(let i = 0;i < uniqueTokens.length;i++){
      url += uniqueTokens[i]
      if(i + 1 < uniqueTokens.length){
          url += ','
      }
  }
  url += '&vs_currencies=usd'
  const response = await fetch(url);
  const body = await response.json();

  return body;
}
export const getManualGaugeName = (gaugeAddress)=>{
  let name = ''
  switch (gaugeAddress) {
    case '0xb9c05b8ee41fdcbd9956114b3af15834fdedcb54':
      name = 'Curve.fi DAI/USDC (DAI+USDC)'
      break;
    case '0xfe1a3dd8b169fb5bf0d5dbfe813d956f39ff6310':
      name = 'Curve.fi fUSDT/DAI/USDC'
      break;
    case '0xc48f4653dd6a9509de44c92beb0604bea3aee714':
      name = 'Curve.fi amDAI/amUSDC/amUSDT'
      break;
    case '0x6955a55416a06839309018a8b0cb72c4ddc11f15':
      name = 'Curve.fi USD-BTC-ETH'
      break;
    case '0x488e6ef919c2bb9de535c634a80afb0114da8f62':
      name = 'Curve.fi amWBTC/renBTC'
      break;
    case '0xfdb129ea4b6f557b07bcdcede54f665b7b6bc281':
      name = 'Curve.fi WBTC/renBTC'
      break;
    case '0x060e386ecfbacf42aa72171af9efe17b3993fc4f':
      name = 'Curve USD-BTC-ETH'
      break;
    case '0x6c09f6727113543fd061a721da512b7efcdd0267':
      name = 'Curve.fi wxDAI/USDC/USDT'
      break;
    case '0xdefd8fdd20e0f34115c7018ccfb655796f6b2168':
      name = 'Curve.fi USD-BTC-ETH'
      break;
    case '0xd8b712d29381748db89c36bca0138d7c75866ddf':
      name = 'Curve.fi Factory USD Metapool: Magic Internet Money 3Pool'
      break;
    default:
  }
  return name
}

export const getGaugeSymbol= (gaugeAddress)=>{
  let name = ''
  switch (gaugeAddress) {
    case '0xb9c05b8ee41fdcbd9956114b3af15834fdedcb54':
      name = 'DAI/USDC'
      break;
    case '0xfe1a3dd8b169fb5bf0d5dbfe813d956f39ff6310':
      name = 'fUSDT/DAI/USDC'
      break;
    case '0xc48f4653dd6a9509de44c92beb0604bea3aee714':
      name = 'amDAI/amUSDC/amUSDT'
      break;
    case '0x6955a55416a06839309018a8b0cb72c4ddc11f15':
      name = 'USD-BTC-ETH'
      break;
    case '0x488e6ef919c2bb9de535c634a80afb0114da8f62':
      name = 'amWBTC/renBTC'
      break;
    case '0xfdb129ea4b6f557b07bcdcede54f665b7b6bc281':
      name = 'WBTC/renBTC'
      break;
    case '0x060e386ecfbacf42aa72171af9efe17b3993fc4f':
      name = 'USD-BTC-ETH'
      break;
    case '0x6c09f6727113543fd061a721da512b7efcdd0267':
      name = 'wxDAI/USDC/USDT'
      break;
    case '0xdefd8fdd20e0f34115c7018ccfb655796f6b2168':
      name = 'USD-BTC-ETH'
      break;
    case '0xd8b712d29381748db89c36bca0138d7c75866ddf':
      name = 'MIM-3LP3CRV'
      break;
    default:
  }
  return name
}
export const addDollarSign = (value) => {
  return '$' + value;
};