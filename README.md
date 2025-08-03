# TRON Basic Order Lifecycle

A cross-chain order execution system that demonstrates the complete lifecycle of a 1inch limit order between TRON (Nile testnet) and Ethereum (Sepolia testnet) networks.

## Overview

This project implements a cross-chain order lifecycle using the 1inch Cross-Chain SDK, enabling users to create, sign, and execute limit orders between TRON and Ethereum networks. The system handles the complete flow from order creation to final settlement across both chains.

## Features

- **Cross-Chain Order Creation**: Create limit orders between TRON and Ethereum networks
- **Order Signing**: Secure order signing using TRON wallet integration
- **Escrow Management**: Automated escrow deployment and management on both chains
- **Order Execution**: Complete order filling and settlement process
- **Withdrawal System**: Automated withdrawal from escrow contracts
- **Multi-Chain Support**: Support for TRON Nile testnet and Ethereum Sepolia testnet

## Architecture

The project consists of several key components:

### Core Components

- **Order Management** (`src/order.cjs`): Handles order creation with proper parameters
- **Contract Integration** (`src/contracts/`): TRON and EVM contract interactions
- **Wallet Management** (`src/wallet/`): Multi-chain wallet operations
- **Indexer** (`src/indexer/`): TRON blockchain event monitoring
- **Utilities** (`src/utils/`): TRON address conversion and validation

### Network Configuration

- **Source Chain (TRON Nile)**: Order creation and source escrow
- **Destination Chain (Ethereum Sepolia)**: Order execution and destination escrow

## Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- TRONGrid API key
- Alchemy API key (for Ethereum Sepolia)
- Private keys for both networks

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tron-basic-order-lifecycle
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# TRON Configuration
TRONGRID_API_KEY=your_tron_grid_api_key
TRON_SRC_USER_PRIVATE_KEY=your_tron_user_private_key
TRON_SRC_RESOLVER_PRIVATE_KEY=your_tron_resolver_private_key

# Ethereum Configuration
SEPOLIA_DST_USER_PRIVATE_KEY=your_ethereum_user_private_key
SEPOLIA_DST_RESOLVER_PRIVATE_KEY=your_ethereum_resolver_private_key
```

## Configuration

The project uses a centralized configuration file (`config/tron.js`) that defines:

- Contract addresses for both networks
- Chain IDs and RPC endpoints
- Token addresses for trading pairs
- Private keys (loaded from environment variables)

### Network Configuration

```javascript
// TRON Nile Testnet
src: {
    ChainId: 3448148188,
    RpcUrl: "https://nile.trongrid.io",
    // ... other configuration
}

// Ethereum Sepolia Testnet
dst: {
    ChainId: 11155111,
    RpcUrl: "https://eth-sepolia.g.alchemy.com/v2/...",
    // ... other configuration
}
```

## Usage

### Running the Order Lifecycle

Execute the complete order lifecycle:

```bash
npm start
# or
node src/index.cjs
```

### Order Lifecycle Steps

1. **Order Creation**: Creates a new cross-chain order with fresh parameters
2. **Order Signing**: Signs the order using the TRON user wallet
3. **Order Filling**: Deploys source escrow and fills the order
4. **Event Monitoring**: Waits for escrow creation events
5. **Destination Deployment**: Deploys destination escrow on Ethereum
6. **Withdrawal**: Withdraws funds from both escrow contracts

### Example Order Parameters

```javascript
const makingAmount = parseUnits("1.432", 18); // ITRC Token Amount
const takingAmount = parseUnits("1", 1); // USDT Token Amount
const secret = "0x0000000000000000000000000000000000000000000000000000000000000000";
```

## Project Structure

```
tron-basic-order-lifecycle/
├── abi/                          # Contract ABIs
│   ├── EscrowFactory.json
│   ├── IERC20.json
│   ├── KycNFT.json
│   └── Resolver.json
├── config/                       # Configuration files
│   └── tron.js
├── src/
│   ├── contracts/               # Contract interaction classes
│   │   ├── evm-escrow-factory.js
│   │   ├── evm-resolver.cjs
│   │   ├── tron-escrow-factory.js
│   │   └── tron-resolver.cjs
│   ├── indexer/                 # Blockchain event monitoring
│   │   └── tron.js
│   ├── utils/                   # Utility functions
│   │   ├── test_tron.cjs
│   │   └── tron.cjs
│   ├── wallet/                  # Wallet management
│   │   └── evm.js
│   ├── index.cjs               # Main application entry point
│   └── order.cjs               # Order creation logic
├── package.json
└── README.md
```

## Key Dependencies

- `@1inch/cross-chain-sdk`: 1inch Cross-Chain SDK for order management
- `tronweb`: TRON blockchain interaction
- `ethers`: Ethereum blockchain interaction
- `axios`: HTTP client for API calls
- `dotenv`: Environment variable management

## Security Considerations

- **Private Keys**: Never commit private keys to version control
- **Environment Variables**: Use `.env` files for sensitive configuration
- **Network Security**: Use testnets for development and testing
- **Contract Verification**: Verify all contract addresses before deployment

## Testing

The project includes test utilities in `src/utils/test_tron.cjs` for validating TRON-specific functionality.

## Troubleshooting

### Common Issues

1. **TRONGrid API Rate Limits**: Ensure you have a valid API key with sufficient quota
2. **Network Connectivity**: Verify RPC endpoint accessibility
3. **Contract Deployment**: Ensure all contracts are deployed on the target networks
4. **Private Key Format**: Verify private keys are in the correct format

### Error Handling

The application includes comprehensive error handling for:
- Contract deployment failures
- Network connectivity issues
- Invalid order parameters
- Transaction failures
