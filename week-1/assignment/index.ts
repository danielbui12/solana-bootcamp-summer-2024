import { TokenStandard, createAndMint, createNft } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { payer } from "@/lib/vars";
import "@solana/web3.js";
import { PublicKey } from '@solana/web3.js';
import { createSignerFromKeypair, generateSigner, percentAmount, signerIdentity } from '@metaplex-foundation/umi';
import { CreateFnParam } from './type';
import { explorerURL, printConsoleSeparator } from './lib/helpers';

const umi = createUmi('https://api.devnet.solana.com');
umi.use(mplCandyMachine());

async function main() {
  const payerWallet = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
  const payerWalletSigner = createSignerFromKeypair(umi, payerWallet);
  // create new mint
  const tokenMint = await createNewToken({ payerWalletSigner, payerWallet });
  const nftMint = await createNewNft({ payerWalletSigner, payerWallet });
  printConsoleSeparator('mint PublicKey');
  console.log('tokenMint: ', tokenMint.toString());
  console.log('nftMint: ', nftMint.toString());

  // mint to

}

async function createNewToken({ payerWalletSigner, payerWallet }: CreateFnParam): Promise<PublicKey> {
  const tokenConfig = {
    name: "Daniel Token",
    symbol: "DT",
    uri: "https://raw.githubusercontent.com/danielbui12/solana-bootcamp-summer-2024/main/week-1/assignment/assets/tokenMetadata.json",
    decimals: 6,
  };
  const mint = generateSigner(umi);
  umi.use(signerIdentity(payerWalletSigner));

  const tx = await createAndMint(umi, {
    mint,
    authority: umi.identity,
    name: tokenConfig.name,
    symbol: tokenConfig.symbol,
    uri: tokenConfig.uri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: tokenConfig.decimals,
    tokenOwner: payerWallet.publicKey as any,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);
  printConsoleSeparator('Sending create token tx...');
  if (tx.result.value.err) {
    console.log("Transaction failed: ", tx.result.value.err);
    throw new Error('Transaction failed');
  }
  // print the explorer url
  console.log("Transaction completed.");
  console.log(explorerURL({ txSignature: tx.signature.toString() }));
  return new PublicKey(mint.publicKey);
}

async function createNewNft({ payerWalletSigner, payerWallet }: CreateFnParam): Promise<PublicKey> {
  const metadata = {
    name: "Daniel NFT",
    symbol: "DNFT",
    uri: "https://raw.githubusercontent.com/danielbui12/solana-bootcamp-summer-2024/main/week-1/assignment/assets/nftMetadata.json",
  };
  const mint = generateSigner(umi);
  umi.use(signerIdentity(payerWalletSigner));

  const tx = await createNft(umi, {
    mint,
    authority: umi.identity,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    tokenOwner: payerWallet.publicKey as any,
    sellerFeeBasisPoints: percentAmount(1000), // Represents 10.00%.
  }).sendAndConfirm(umi);

  printConsoleSeparator('Sending create NFT tx...');
  if (tx.result.value.err) {
    console.log("Transaction failed: ", tx.result.value.err);
    throw new Error('Transaction failed');
  }
  // print the explorer url
  console.log("Transaction completed.");
  console.log(explorerURL({ txSignature: tx.signature.toString() }));
  return new PublicKey(mint.publicKey);
}

async function mintToken() {
}
main();
