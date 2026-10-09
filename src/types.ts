export interface GeminiRunResult {
  text: string;
  model: string;
  prompt: string;
  durationMs: number;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  } | null;
}

export interface ServerStatus {
  status: string;
  apiKeyConfigured: boolean;
  defaultModel: string;
  defaultPrompt: string;
  httpServer8080Running?: boolean;
}

export interface HttpServerTestResult {
  success: boolean;
  port: number;
  statusCode?: number;
  statusMessage?: string;
  headers?: Record<string, string>;
  body?: string;
  latencyMs: number;
  error?: string;
}

export interface CliExpressDemoResult {
  stdoutLines: string[];
  platform: string;
  arch: string;
  type: string;
  release: string;
  cpus: number;
  uptimeSec: number;
  expressResponse: string;
  scriptPath: string;
}

export interface CliRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface ScriptRunResult {
  success: boolean;
  command: string;
  script: string;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp?: number;
}

export interface StructuredTopicResult {
  topic: string;
  summary: string;
  keyConcepts: string[];
  recommendations: string[];
  ratingOutOfTen?: number;
}

export interface VariablesFunctionsResult {
  success: boolean;
  command: string;
  inputs: {
    user: string;
    num1: number;
    num2: number;
  };
  greetOutput: string;
  addOutput: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface ScannerEnvStatus {
  wssRpcConfigured: boolean;
  wssMasked: string | null;
  privateKeyConfigured: boolean;
  signerAddress: string | null;
  gasBalanceEth?: number;
  privateKeyError: string | null;
  arbitrageContractConfigured: boolean;
  arbitrageContractAddress: string;
  executionMode: "LIVE_WEBSOCKET" | "ISOLATED_SIMULATION";
  serverTime: string;
  securityGuidelines: {
    privateKeyInClient: boolean;
    serverOnlyExecution: boolean;
    mempoolProtection: string;
  };
  requiredVars: Array<{
    key: string;
    description: string;
    configured: boolean;
    example: string;
  }>;
}

export interface RpcTestResult {
  success: boolean;
  endpointTested: string;
  latencyMs: number;
  blockNumber?: number;
  chainId?: number;
  networkName?: string;
  isPrivateMempool?: boolean;
  protocol?: string;
  status?: string;
  error?: string;
}

export interface SpreadSimulationResult {
  success: boolean;
  tokenPair: string;
  prices: {
    uniswapPrice: number;
    sushiswapPrice: number;
    priceDifference: number;
    spreadPercentage: number;
    uniSqrtPriceX96: string;
    sushiReserve0: string;
    sushiReserve1: string;
  };
  arbitrageStrategy: {
    cheaperDex: string;
    expensiveDex: string;
    tradeDirection: string;
  };
  financials: {
    borrowAmountUsd: number;
    grossProfitUsd: number;
    flashLoanFeeUsd: number;
    estimatedGasCostUsd: number;
    netProfitUsd: number;
    isProfitable: boolean;
    roiPercent: number;
  };
  tradeRoute: Array<{
    step: number;
    action: string;
    description: string;
  }>;
}

export interface FlashLoanTriggerResult {
  success: boolean;
  executionMode: string;
  contractAddress: string;
  basescanContractUrl?: string;
  basescanTxUrl?: string;
  network?: string;
  signer: string;
  calldata: string;
  functionSignature: string;
  params: {
    asset: string;
    assetSymbol?: string;
    symbol?: string;
    borrowAmount?: string;
    amountRaw?: string;
    amountFormatted?: string;
    aaveV3FlashLoanFee?: string;
    estimatedGasCostEth?: string;
    buyDex?: string;
    sellDex?: string;
  };
  transaction: {
    txHash: string;
    bundleHash: string;
    targetBlock: number;
    gasLimit: number;
    maxPriorityFeeGwei: number;
    mempoolType: string;
    status: string;
  };
  durationMs?: number;
}

export interface ScannerAutomationEvent {
  timestamp: number;
  type: "SCAN_TICK" | "PROFITABLE_SPREAD" | "FLASH_BUNDLE" | "AUTO_REFILL" | "MANUAL_REFILL";
  message: string;
  pair: string;
  spreadPercent?: number;
  gasRemainingEth?: number;
}

export interface ScannerAutomationState {
  isRunning: boolean;
  startedAt: number;
  scanIntervalMs: number;
  totalTicks: number;
  profitableSpreadsFound: number;
  autoSimulatedBundles: number;
  gasConsumedEth: number;
  autoRefillEnabled: boolean;
  autoRefillThresholdEth: number;
  lastTickTimestamp: number;
  lastDetectedSpread: number;
  lastDetectedPair: string;
  recentEvents: ScannerAutomationEvent[];
}

export type PortProtocol = "HTTP" | "WebSocket" | "TCP" | "UDP" | "JSON-RPC" | "Postgres" | "Redis" | "gRPC";
export type PortCategory = "web" | "blockchain" | "p2p" | "database" | "cache" | "telemetry" | "custom";
export type PortStatus = "listening" | "active" | "standby" | "mesh-client";

export interface PortDefinition {
  id: string;
  port: number;
  name: string;
  protocol: PortProtocol;
  category: PortCategory;
  localUrl: string;
  proxyPath: string;
  gatewayUrl?: string;
  description: string;
  role: string;
  status: PortStatus;
  curlCommand: string;
  tags: string[];
  btcAddress?: string;
  balanceSatoshis?: number;
  txCount?: number;
  lastProbe?: {
    timestamp: number;
    latencyMs: number;
    statusCode?: number;
    statusMessage?: string;
    isListening: boolean;
    responsePreview?: string;
  };
}

export interface PortProbeResult {
  port: number;
  protocol: PortProtocol;
  isListening: boolean;
  latencyMs: number;
  statusCode?: number;
  statusMessage?: string;
  bannerOrBody?: string;
  localUrl: string;
  gatewayUrl: string;
  curlCommand: string;
  timestamp: number;
  error?: string;
}

export interface PortDirectoryResponse {
  success: boolean;
  totalPorts: number;
  listeningCount: number;
  gatewayBaseUrl: string;
  ports: PortDefinition[];
  systemSummary: {
    hostname: string;
    platform: string;
    arch: string;
    activeServerPort: number;
    demoServer8080Running: boolean;
    tcpSyncServer6000Running: boolean;
    udpDiscovery7000Running: boolean;
  };
}


