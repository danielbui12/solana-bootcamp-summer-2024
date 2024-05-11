import { KeypairSigner, Keypair } from "@metaplex-foundation/umi";

export interface CreateFnParam {
  payerWalletSigner: KeypairSigner;
  payerWallet: Keypair;
}