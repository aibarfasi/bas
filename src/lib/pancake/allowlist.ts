export const PANCAKE = {
  smartRouter: "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4",
  nfpm: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
  masterChefV3: "0x556B9306565093C855AEA9AE92A594704c2Cd59e",
  quoter: "0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997",
  wbnb: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  usdt: "0x55d398326f99059fF775485246999027B3197955",
} as const;

export const PANCAKE_ALLOWLIST = [
  { label: "PancakeSwap Smart Router", address: PANCAKE.smartRouter },
  { label: "NonfungiblePositionManager", address: PANCAKE.nfpm },
  { label: "MasterChef V3", address: PANCAKE.masterChefV3 },
];

export const DEFAULT_MIN_OUT_BPS = 50;
