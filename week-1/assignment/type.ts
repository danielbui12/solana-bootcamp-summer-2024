import { Keypair, PublicKey, Signer } from '@solana/web3.js';

export interface CreateFnParam {
  payer: Keypair;
  mint: Keypair;
}

export interface MintFnParam {
  mint: PublicKey;
  payer: Signer;
}