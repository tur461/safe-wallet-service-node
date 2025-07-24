# Safe Wallet Service Node

A **Gnosis Safe-based wallet service node** implemented in **Node.js**.  
This service provides decentralized, peer-to-peer, and secure wallet operations using **Hyperswarm**, **Hypercore (corestore)**, **Autobase**, and **Hyperbee**.

---

## Overview

The **Safe Wallet Service Node** allows for:
- Decentralized peer-to-peer networking
- A dedicated RPC server for wallet operations
- A distributed key-value database built with Hypercore (corestore) stack
- Future-ready Gnosis Safe integration for multisig wallet management

This repository also includes:
- **RPC Client Program** – to test and interact with the wallet service node.
- **Hardhat Project** – for deploying and testing Gnosis Safe smart contracts locally.

---

## Features

### Completed
- **Swarm Networking**  
  Built with [Hyperswarm](https://github.com/holepunchto/hyperswarm) for peer discovery and secure communication.
  
- **RPC Server**  
  Uses [@hyperswarm/rpc](https://github.com/holepunchto/rpc) for remote procedure calls between peers.

- **Decentralized Database**  
  Leveraging **Hypercore**, **Autobase**, and **Hyperbee** for a resilient, append-only, and replicated data layer.

---

### Pending
- **Gnosis Safe SDK Integration**  
  Full integration for managing and interacting with Gnosis Safe contracts.
  
- **Multisig Signature Generation**  
  Create and coordinate multiple signatures across different nodes.

- **Transaction Lifecycle Management**  
  Proposal creation, signing, and execution of transactions.

---

## Repository Structure

- **/modules** – Core wallet service node modules
- **/hnode** – Hardhat project for deploying Gnosis Safe contracts

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Hardhat for contract deployment  
  ```bash
  npm install --save-dev hardhat
