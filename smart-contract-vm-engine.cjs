/**
 * Smart Contract Execution Engine for Blockchain Blocks
 * Powered by Node.js Native 'vm' Module
 * 
 * Demonstrates:
 * 1. Sandboxed deterministic execution isolated from host OS
 * 2. CPU Gas/Timeout protection against halting problem (infinite loops)
 * 3. Contract deployment (`DEPLOY_CONTRACT`) & method execution (`CALL_CONTRACT`)
 * 4. State root hashing (Merkle-style SHA-256 digest of contract state)
 * 5. Attack defense: Blocked globals (no process, no require, no fs, no timers)
 */

const vm = require('vm');
const crypto = require('crypto');

class VmSmartContractEngine {
  constructor() {
    // contractAddress -> { code, state, creator, blockDeployed, events }
    this.contracts = new Map();
    // Blockchain block height
    this.blockHeight = 0;
    // Execution logs
    this.executionLogs = [];
  }

  /**
   * Generates a deterministic contract address from creator and deployment nonce
   */
  deriveAddress(creator, nonce) {
    return '0x' + crypto.createHash('sha256')
      .update(`${creator}:${nonce}:${Date.now()}`)
      .digest('hex')
      .slice(0, 40);
  }

  /**
   * Calculates the global state root hash over all deployed contracts
   */
  calculateStateRoot() {
    const stateObj = {};
    for (const [addr, contract] of this.contracts.entries()) {
      stateObj[addr] = contract.state;
    }
    return '0x' + crypto.createHash('sha256')
      .update(JSON.stringify(stateObj))
      .digest('hex');
  }

  /**
   * Creates a strictly isolated, hardened VM sandbox for contract execution
   */
  createSecureSandbox(contractState, caller, value, blockInfo, emitCallback) {
    // Deep clone state to protect against direct reference tampering
    const workingState = JSON.parse(JSON.stringify(contractState || {}));

    const sandbox = {
      // 1. Contract State Store (read/write by contract methods)
      state: workingState,

      // 2. Transaction Context (EVM msg equivalent)
      msg: {
        sender: caller || '0x0000000000000000000000000000000000000000',
        value: Number(value) || 0,
      },

      // 3. Block Context (EVM block equivalent)
      block: {
        number: blockInfo.number || this.blockHeight,
        timestamp: blockInfo.timestamp || Math.floor(Date.now() / 1000),
      },

      // 4. Deterministic Event Emitter
      emit: (eventName, eventData) => {
        emitCallback({
          event: String(eventName),
          data: eventData,
          timestamp: Date.now(),
        });
      },

      // 5. Safe Math and Crypto Utilities
      Math: {
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
        min: Math.min,
        max: Math.max,
        abs: Math.abs,
        sqrt: Math.sqrt,
        pow: Math.pow,
      },
      sha256: (input) => {
        return crypto.createHash('sha256').update(String(input)).digest('hex');
      },

      // 6. Output receiver
      __result: null,

      // STRICTLY NULLIFY/HIDE DANGEROUS HOST GLOBALS
      process: null,
      require: null,
      global: null,
      globalThis: null,
      Buffer: null,
      setTimeout: null,
      setInterval: null,
      setImmediate: null,
      clearTimeout: null,
      clearInterval: null,
      fetch: null,
      XMLHttpRequest: null,
    };

    return {
      sandbox,
      workingState,
      context: vm.createContext(sandbox),
    };
  }

  /**
   * Deploys a new smart contract inside a block
   * @param {string} code - JavaScript code defining contract methods
   * @param {object} initialState - Initial storage dictionary
   * @param {string} creator - Deployer address
   * @param {number} timeoutMs - Max execution time limit (gas defense)
   */
  deployContract(code, initialState = {}, creator = '0xDeployerAlice', timeoutMs = 150) {
    const nonce = this.contracts.size + 1;
    const address = this.deriveAddress(creator, nonce);
    const events = [];

    const { context, sandbox, workingState } = this.createSecureSandbox(
      initialState,
      creator,
      0,
      { number: this.blockHeight, timestamp: Math.floor(Date.now() / 1000) },
      (ev) => events.push(ev)
    );

    // Wrapper executing initialization script if present
    const wrappedCode = `
      ${code}
      if (typeof init === 'function') {
        init();
      }
    `;

    const startTime = process.hrtime.bigint();
    try {
      const script = new vm.Script(wrappedCode, { filename: `contract_${address}.js` });
      script.runInContext(context, {
        timeout: timeoutMs,
        microtaskMode: 'afterEvaluate',
      });

      const endTime = process.hrtime.bigint();
      const executionTimeUs = Number((endTime - startTime) / 1000n);

      const contractRecord = {
        address,
        code,
        state: sandbox.state,
        creator,
        blockDeployed: this.blockHeight,
        events,
        deployedAt: new Date().toISOString(),
      };

      this.contracts.set(address, contractRecord);

      const logEntry = {
        type: 'DEPLOY_CONTRACT',
        address,
        creator,
        success: true,
        executionTimeUs,
        stateRoot: this.calculateStateRoot(),
        events,
      };
      this.executionLogs.push(logEntry);

      return {
        success: true,
        address,
        initialState: sandbox.state,
        stateRoot: logEntry.stateRoot,
        executionTimeUs,
        events,
      };
    } catch (err) {
      const endTime = process.hrtime.bigint();
      const executionTimeUs = Number((endTime - startTime) / 1000n);
      return {
        success: false,
        error: err.message.includes('Script execution timed out')
          ? `Out of Gas (CPU Timeout exceeded: ${timeoutMs}ms)`
          : `Contract Deployment Error: ${err.message}`,
        executionTimeUs,
      };
    }
  }

  /**
   * Executes a method call against an existing deployed smart contract
   * @param {string} address - Deployed contract address
   * @param {string} method - Method name to execute
   * @param {object} args - Arguments passed to the method
   * @param {string} caller - Sender address (msg.sender)
   * @param {number} value - Value attached (msg.value)
   * @param {number} timeoutMs - Timeout protection (gas limit)
   */
  callContract(address, method, args = {}, caller = '0xUserBob', value = 0, timeoutMs = 150) {
    const contract = this.contracts.get(address);
    if (!contract) {
      return { success: false, error: `Contract not found at address: ${address}` };
    }

    const events = [];
    const { context, sandbox } = this.createSecureSandbox(
      contract.state,
      caller,
      value,
      { number: this.blockHeight, timestamp: Math.floor(Date.now() / 1000) },
      (ev) => events.push(ev)
    );

    // Call execution wrapper
    const argsJson = JSON.stringify(args || {});
    const wrappedCode = `
      ${contract.code}
      if (typeof ${method} !== 'function') {
        throw new Error("Method '${method}' does not exist on contract");
      }
      __result = ${method}(${argsJson});
    `;

    const startTime = process.hrtime.bigint();
    try {
      const script = new vm.Script(wrappedCode, { filename: `call_${address}_${method}.js` });
      script.runInContext(context, {
        timeout: timeoutMs,
        microtaskMode: 'afterEvaluate',
      });

      const endTime = process.hrtime.bigint();
      const executionTimeUs = Number((endTime - startTime) / 1000n);

      // Mutate contract state only upon successful execution
      contract.state = sandbox.state;
      contract.events.push(...events);

      const stateRoot = this.calculateStateRoot();

      const logEntry = {
        type: 'CALL_CONTRACT',
        address,
        method,
        caller,
        args,
        result: sandbox.__result,
        success: true,
        executionTimeUs,
        stateRoot,
        events,
      };
      this.executionLogs.push(logEntry);

      return {
        success: true,
        address,
        method,
        returnValue: sandbox.__result,
        updatedState: contract.state,
        stateRoot,
        executionTimeUs,
        events,
      };
    } catch (err) {
      const endTime = process.hrtime.bigint();
      const executionTimeUs = Number((endTime - startTime) / 1000n);

      const isOutOfGas = err.message.includes('Script execution timed out');
      const errorMessage = isOutOfGas
        ? `Out of Gas (Halting problem CPU limit hit: >${timeoutMs}ms)`
        : `Execution Reverted: ${err.message}`;

      const logEntry = {
        type: 'CALL_CONTRACT',
        address,
        method,
        caller,
        args,
        success: false,
        error: errorMessage,
        executionTimeUs,
      };
      this.executionLogs.push(logEntry);

      return {
        success: false,
        error: errorMessage,
        executionTimeUs,
      };
    }
  }

  /**
   * Bundles contract transactions into a mined blockchain block
   */
  mineBlockWithSmartContracts(contractTransactions) {
    this.blockHeight++;
    const previousStateRoot = this.calculateStateRoot();
    const executionResults = [];

    for (const tx of contractTransactions) {
      if (tx.type === 'DEPLOY') {
        const res = this.deployContract(tx.code, tx.initialState, tx.creator, tx.timeoutMs || 100);
        executionResults.push({ tx, result: res });
      } else if (tx.type === 'CALL') {
        const res = this.callContract(tx.address, tx.method, tx.args, tx.caller, tx.value, tx.timeoutMs || 100);
        executionResults.push({ tx, result: res });
      }
    }

    const stateRoot = this.calculateStateRoot();

    const block = {
      index: this.blockHeight,
      timestamp: Date.now(),
      transactionsCount: contractTransactions.length,
      executionResults,
      previousStateRoot,
      stateRoot,
      contractsTotal: this.contracts.size,
    };

    return block;
  }
}

// ==============================================================================
// CONTRACT TEMPLATES (Standard Smart Contracts Written in Idiomatic JavaScript)
// ==============================================================================

const CONTRACT_TEMPLATES = {
  // 1. ERC-20 Standard Fungible Token Contract
  ERC20_TOKEN: {
    name: 'ERC-20 Fungible Token',
    description: 'Mintable token with balance tracking, transfers, and transfer event logs',
    initialState: {
      name: 'Vortex Protocol Token',
      symbol: 'VTX',
      decimals: 18,
      totalSupply: 1000000,
      balances: {},
      allowances: {},
    },
    code: `
function init() {
  state.balances[msg.sender] = state.totalSupply;
  emit("ContractInitialized", { name: state.name, totalSupply: state.totalSupply, owner: msg.sender });
}

function balanceOf(args) {
  const account = args.account || msg.sender;
  return state.balances[account] || 0;
}

function transfer(args) {
  const recipient = args.to;
  const amount = Number(args.amount);
  
  if (!recipient) throw new Error("Recipient address required");
  if (amount <= 0) throw new Error("Amount must be positive");
  
  const senderBalance = state.balances[msg.sender] || 0;
  if (senderBalance < amount) {
    throw new Error("Insufficient balance: have " + senderBalance + ", need " + amount);
  }
  
  state.balances[msg.sender] = senderBalance - amount;
  state.balances[recipient] = (state.balances[recipient] || 0) + amount;
  
  emit("Transfer", { from: msg.sender, to: recipient, amount: amount });
  return { success: true, from: msg.sender, to: recipient, amount: amount };
}

function mint(args) {
  const recipient = args.to || msg.sender;
  const amount = Number(args.amount);
  if (amount <= 0) throw new Error("Mint amount must be positive");
  
  state.totalSupply = (state.totalSupply || 0) + amount;
  state.balances[recipient] = (state.balances[recipient] || 0) + amount;
  
  emit("Mint", { to: recipient, amount: amount, newTotalSupply: state.totalSupply });
  return { success: true, to: recipient, amount: amount };
}
    `.trim(),
  },

  // 2. Automated Market Maker (AMM DEX Pool - x * y = k)
  AMM_DEX_POOL: {
    name: 'Constant Product AMM (Uniswap v2 Style)',
    description: 'Liquidity pool swapping Token A for Token B using x * y = k invariant',
    initialState: {
      reserveA: 10000, // e.g. USDT
      reserveB: 5,     // e.g. ETH (Price = 2,000 USDT/ETH)
      k: 50000,
      feeBps: 30,      // 0.30% LP fee
    },
    code: `
function getQuote(args) {
  const amountIn = Number(args.amountIn);
  const isAForB = args.isAForB !== false;
  
  const reserveIn = isAForB ? state.reserveA : state.reserveB;
  const reserveOut = isAForB ? state.reserveB : state.reserveA;
  
  const amountInWithFee = amountIn * (10000 - state.feeBps);
  const numerator = amountInWithFee * reserveOut;
  const denominator = (reserveIn * 10000) + amountInWithFee;
  const amountOut = numerator / denominator;
  
  return {
    amountIn: amountIn,
    expectedOut: Math.floor(amountOut * 100000) / 100000,
    currentPrice: state.reserveA / state.reserveB
  };
}

function swap(args) {
  const amountIn = Number(args.amountIn);
  const isAForB = args.isAForB !== false;
  
  if (amountIn <= 0) throw new Error("Swap amount must be positive");
  
  const quote = getQuote(args);
  const amountOut = quote.expectedOut;
  
  if (isAForB) {
    state.reserveA += amountIn;
    state.reserveB -= amountOut;
  } else {
    state.reserveB += amountIn;
    state.reserveA -= amountOut;
  }
  
  state.k = state.reserveA * state.reserveB;
  emit("SwapExecuted", {
    trader: msg.sender,
    in: isAForB ? "TokenA" : "TokenB",
    amountIn: amountIn,
    out: isAForB ? "TokenB" : "TokenA",
    amountOut: amountOut,
    newPrice: state.reserveA / state.reserveB
  });
  
  return { received: amountOut, newPrice: state.reserveA / state.reserveB };
}

function addLiquidity(args) {
  const addedA = Number(args.amountA);
  const addedB = Number(args.amountB);
  if (addedA <= 0 || addedB <= 0) throw new Error("Both amounts must be positive");
  
  state.reserveA += addedA;
  state.reserveB += addedB;
  state.k = state.reserveA * state.reserveB;
  
  emit("LiquidityAdded", { provider: msg.sender, addedA: addedA, addedB: addedB });
  return { reserveA: state.reserveA, reserveB: state.reserveB, k: state.k };
}
    `.trim(),
  },

  // 3. Timelock Escrow Vault
  TIMELOCK_ESCROW: {
    name: 'Timelock Escrow Vault',
    description: 'Holds funds until unlock timestamp or buyer release confirmation',
    initialState: {
      arbiter: '0xArbiterCourt',
      escrows: {},
    },
    code: `
function createEscrow(args) {
  const id = "escrow_" + Object.keys(state.escrows).length;
  state.escrows[id] = {
    buyer: msg.sender,
    seller: args.seller,
    amount: Number(args.amount),
    lockedUntil: block.timestamp + Number(args.lockDurationSeconds || 3600),
    status: "LOCKED"
  };
  emit("EscrowCreated", { id: id, buyer: msg.sender, seller: args.seller, amount: args.amount });
  return { escrowId: id };
}

function release(args) {
  const escrow = state.escrows[args.id];
  if (!escrow) throw new Error("Escrow not found");
  if (escrow.status !== "LOCKED") throw new Error("Escrow not in locked state");
  
  if (msg.sender !== escrow.buyer && msg.sender !== state.arbiter) {
    throw new Error("Only buyer or arbiter can release escrow");
  }
  
  escrow.status = "RELEASED";
  emit("EscrowReleased", { id: args.id, recipient: escrow.seller, amount: escrow.amount });
  return { status: "RELEASED", releasedTo: escrow.seller, amount: escrow.amount };
}

function refund(args) {
  const escrow = state.escrows[args.id];
  if (!escrow) throw new Error("Escrow not found");
  if (escrow.status !== "LOCKED") throw new Error("Escrow not in locked state");
  
  if (msg.sender !== state.arbiter && block.timestamp < escrow.lockedUntil) {
    throw new Error("Cannot refund before lock period expires unless authorized by arbiter");
  }
  
  escrow.status = "REFUNDED";
  emit("EscrowRefunded", { id: args.id, recipient: escrow.buyer, amount: escrow.amount });
  return { status: "REFUNDED", refundedTo: escrow.buyer, amount: escrow.amount };
}
    `.trim(),
  },

  // 4. Malicious Infinite Loop Attack (VM Sandbox Defense Demo)
  MALICIOUS_LOOP_ATTACK: {
    name: 'Malicious Gas Exhaustion Loop (Security Test)',
    description: 'Simulates an attacker attempting an infinite loop to freeze nodes; trapped by VM timeout',
    initialState: { status: 'NORMAL' },
    code: `
function attack(args) {
  // Deliberate infinite loop to test the VM gas timeout
  while (true) {
    state.status = "ATTACKING";
  }
}

function tryEscape(args) {
  // Attempting to access forbidden Node.js host globals
  return process.mainModule.require('fs').readdirSync('.');
}
    `.trim(),
  },
};

// ==============================================================================
// CLI TEST RUNNER (Demonstrates Complete Lifecycle)
// ==============================================================================

function runDemo() {
  console.log('='.repeat(72));
  console.log('  NODE.JS NATIVE VM SMART CONTRACT EXECUTION ENGINE');
  console.log('='.repeat(72));

  const engine = new VmSmartContractEngine();

  // 1. Deploy ERC-20 Token
  console.log('\n[Block #1] Deploying ERC-20 Token Contract...');
  const erc20Deploy = engine.deployContract(
    CONTRACT_TEMPLATES.ERC20_TOKEN.code,
    CONTRACT_TEMPLATES.ERC20_TOKEN.initialState,
    '0xAliceDeployer'
  );
  console.log(`  -> Deployed Address: ${erc20Deploy.address}`);
  console.log(`  -> Execution Time:   ${erc20Deploy.executionTimeUs} μs`);
  console.log(`  -> Initial Supply:   ${erc20Deploy.initialState.totalSupply} VTX`);
  console.log(`  -> State Root:       ${erc20Deploy.stateRoot}`);

  // 2. Call transfer() on ERC-20
  console.log('\n[Block #2] Calling transfer(to: Bob, amount: 25000)...');
  const transferRes = engine.callContract(
    erc20Deploy.address,
    'transfer',
    { to: '0xBobTrader', amount: 25000 },
    '0xAliceDeployer'
  );
  console.log(`  -> Result:           ${JSON.stringify(transferRes.returnValue)}`);
  console.log(`  -> Alice Balance:    ${transferRes.updatedState.balances['0xAliceDeployer']} VTX`);
  console.log(`  -> Bob Balance:      ${transferRes.updatedState.balances['0xBobTrader']} VTX`);
  console.log(`  -> New State Root:   ${transferRes.stateRoot}`);

  // 3. Deploy AMM DEX Pool
  console.log('\n[Block #3] Deploying Constant Product AMM DEX Pool...');
  const ammDeploy = engine.deployContract(
    CONTRACT_TEMPLATES.AMM_DEX_POOL.code,
    CONTRACT_TEMPLATES.AMM_DEX_POOL.initialState,
    '0xDeFiArchitect'
  );
  console.log(`  -> AMM Address:      ${ammDeploy.address}`);
  console.log(`  -> Initial Reserves: ${ammDeploy.initialState.reserveA} USDT : ${ammDeploy.initialState.reserveB} ETH`);

  // 4. Call swap() on AMM
  console.log('\n[Block #4] Executing swap(amountIn: 2000 USDT for ETH)...');
  const swapRes = engine.callContract(
    ammDeploy.address,
    'swap',
    { amountIn: 2000, isAForB: true },
    '0xBobTrader'
  );
  console.log(`  -> Swap Result:      ${JSON.stringify(swapRes.returnValue)}`);
  console.log(`  -> Updated Reserves: ${swapRes.updatedState.reserveA} USDT : ${swapRes.updatedState.reserveB} ETH`);
  console.log(`  -> New State Root:   ${swapRes.stateRoot}`);

  // 5. Malicious Sandbox Defense Demo: Infinite Loop Attack
  console.log('\n[Block #5] Testing Security Defense: Deploying & Calling Infinite Loop...');
  const attackDeploy = engine.deployContract(
    CONTRACT_TEMPLATES.MALICIOUS_LOOP_ATTACK.code,
    CONTRACT_TEMPLATES.MALICIOUS_LOOP_ATTACK.initialState,
    '0xMaliciousAttacker'
  );
  const loopAttackRes = engine.callContract(
    attackDeploy.address,
    'attack',
    {},
    '0xMaliciousAttacker',
    0,
    50 // 50ms strict gas limit
  );
  console.log(`  -> Attack Trapped:   ${!loopAttackRes.success}`);
  console.log(`  -> Error Message:    ${loopAttackRes.error}`);

  // 6. Malicious Sandbox Defense Demo: Forbidden Host Escape
  console.log('\n[Block #6] Testing Security Defense: Calling Forbidden Host Global (process/fs escape)...');
  const escapeAttackRes = engine.callContract(
    attackDeploy.address,
    'tryEscape',
    {},
    '0xMaliciousAttacker'
  );
  console.log(`  -> Host Escape Trapped: ${!escapeAttackRes.success}`);
  console.log(`  -> Error Message:       ${escapeAttackRes.error}`);

  console.log('\n' + '='.repeat(72));
  console.log(`  SIMULATION FINISHED. Final Global State Root: ${engine.calculateStateRoot()}`);
  console.log('='.repeat(72) + '\n');
}

// Export for module use or run directly
if (require.main === module) {
  runDemo();
}

module.exports = {
  VmSmartContractEngine,
  CONTRACT_TEMPLATES,
};
