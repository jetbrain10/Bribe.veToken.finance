import BigNumber from 'bignumber.js';

// URLS
export const GAS_PRICE_API = 'https://gasprice.poa.network/';
export const ZAPPER_GAS_PRICE_API = 'https://api.zapper.fi/v1/gas-price?api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241'
export const ETHERSCAN_URL = 'https://etherscan.io/';


// DEFINE CONTRACT ADDRESSES
export const BRIBERY_ADDRESS = '0x171f3cd87e043539ef64b19121854cd1ab74894f'
export const BRIBERY_ADDRESS_V2 = '0x7893bbb46613d7a4fbcc31dab4c9b823ffee1026'
export const GAUGE_CONTROLLER_ADDRESS = '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB'
export const BRIBERY_TOKENS_ADDRESS_V2 = '0xF40A62b2C2bbf8469174F786F103EAfC0235D8AB'
export const VOTE_BRIBERY_ADDRESS = '0xA49B8296fDB0Ee3Da0428D56FEb0d32d07607D6F'
export const VOTE_SOURCE_ADDRESS = '0xE478de485ad2fe566d49342Cbd03E49ed7DB3356'

// GENERAL
export const ERROR = 'ERROR';
export const STORE_UPDATED = 'STORE_UPDATED';
export const TX_SUBMITTED = 'TX_SUBMITTED';

export const CONNECTION_CONNECTED = 'CONNECTION_CONNECTED';
export const CONNECTION_DISCONNECTED = 'CONNECTION_DISCONNECTED';
export const CONNECT_WALLET = 'CONNECT_WALLET';

export const CONFIGURE = 'CONFIGURE';
export const CONFIGURE_RETURNED = 'CONFIGURE_RETURNED';

export const ACCOUNT_CONFIGURED = 'ACCOUNT_CONFIGURED';
export const ACCOUNT_CHANGED = 'ACCOUNT_CHANGED';

export const GET_GAS_PRICES = 'GET_GAS_PRICES';
export const GAS_PRICES_RETURNED = 'GAS_PRICES_RETURNED';


// INCENTIVES

export const INCENTIVES_UPDATED = 'INCENTIVES_UPDATED';

export const CONFIGURE_INCENTIVES = 'CONFIGURE_INCENTIVES';
export const INCENTIVES_CONFIGURED = 'INCENTIVES_CONFIGURED';

export const GET_INCENTIVES_BALANCES = 'GET_INCENTIVES_BALANCES';
export const INCENTIVES_BALANCES_RETURNED = 'INCENTIVES_BALANCES_RETURNED';

export const CLAIM_REWARD = 'CLAIM_REWARD'
export const REWARD_CLAIMED = 'REWARD_CLAIMED'

export const SEARCH_TOKEN = 'SEARCH_TOKEN'
export const SEARCH_TOKEN_RETURNED = 'SEARCH_TOKEN_RETURNED'

export const ADD_REWARD = 'ADD_REWARD'
export const ADD_REWARD_RETURNED = 'ADD_REWARD_RETURNED'

// VOTE INCENTIVES

export const ADD_VOTE_REWARD = 'ADD_VOTE_REWARD'
export const ADD_VOTE_REWARD_RETURNED = 'ADD_VOTE_REWARD_RETURNED'

export const CLAIM_VOTE_REWARD = 'CLAIM_VOTE_REWARD'
export const VOTE_REWARD_CLAIMED = 'VOTE_REWARD_CLAIMED'

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0);
export const WEEK = BigNumber(86400).times(7).toFixed(0);

export const gaugeGraphUrl = 'https://api.thegraph.com/subgraphs/name/jaqensyrio/bribecrv/'
