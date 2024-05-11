import { STATIC_PUBLICKEY, payer } from "@/lib/vars";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { CreateFnParam, MintFnParam } from './type';
import { explorerURL } from './lib/helpers';
import { MINT_SIZE, createAssociatedTokenAccountInstruction, createInitializeMint2Instruction, createMintToInstruction, getAssociatedTokenAddressSync, getMinimumBalanceForRentExemptMint } from '@solana/spl-token';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js";

const connection = new Connection('https://api.devnet.solana.com');

async function main() {
  // create new mint
  const nftMint = Keypair.generate();
  await createNewNft({ payer, mint: nftMint });
  console.log('nftMint', nftMint.publicKey.toBase58());

  const tokenMint = Keypair.generate();
  const createTokenMintIx = await createNewToken({ payer, mint: tokenMint });
  console.log('tokenMint', tokenMint.publicKey.toBase58());

  // mint to
  const mintToIx = createMintTokenInstruction({
    mint: new PublicKey(tokenMint.publicKey),
    payer,
  });

  // create tx
  const ixs = [...createTokenMintIx, ...mintToIx] as TransactionInstruction[];  
  const tx = new Transaction()
    .add(...ixs)

  console.log('Sending tx...');
  await sendAndConfirmTransaction(connection, tx, [payer, tokenMint], { commitment: 'finalized' })
    .then((sig) => {
      explorerURL({ txSignature: sig });
    })
    .catch((err) => {
      console.log(err);
    });
}

async function createNewNft({ payer, mint }: CreateFnParam) {
  const nftMetadta = require('@/assets/nftMetadata.json');
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      }),
    );

  console.log("Uploading metadata...");
  const { uri } = await metaplex.nfts().uploadMetadata(nftMetadta);
  console.log("Metadata uploaded:", uri);
  const { nft, response } = await metaplex.nfts().create(
    {
      name: nftMetadta.name,
      symbol: nftMetadta.symbol,
      sellerFeeBasisPoints: nftMetadta.sellerFeeBasisPoints,
      uri: uri,
      useNewMint: mint,
      isMutable: false,
    },
    { commitment: "finalized" }
  );
  console.log(explorerURL({ txSignature: response.signature }));
}

async function createNewToken({ payer, mint }: CreateFnParam): Promise<TransactionInstruction[]> {
  const tokenConfig = {
    name: "Daniel Token",
    symbol: "DT",
    uri: "https://raw.githubusercontent.com/danielbui12/solana-bootcamp-summer-2024/main/week-1/assignment/assets/tokenMetadata.json",
    decimals: 6,
  };

  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  return [
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID
    }),
    createInitializeMint2Instruction(
      mint.publicKey,
      tokenConfig.decimals,
      payer.publicKey,
      payer.publicKey,
      TOKEN_PROGRAM_ID,
    ),
    createCreateMetadataAccountV3Instruction({
      metadata: PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          mint.publicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      )[0],
      mint: mint.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          uri: tokenConfig.uri,
          creators: null,
          sellerFeeBasisPoints: 0,
          uses: null,
          collection: null,
        },
        isMutable: false,
        collectionDetails: null,
      },
    })
  ];
}

function createMintTokenInstruction({ mint, payer }: MintFnParam): TransactionInstruction[] {
  // get or create the token's ata
  const payerAssociatedToken = getAssociatedTokenAddressSync(
    mint,
    payer.publicKey,
  );
  const createPayerTokenAccountIx = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    payerAssociatedToken,
    payer.publicKey,
    mint,
  )
  console.log("Payer token account address:", payerAssociatedToken.toBase58());

  const staticWalletAssociatedToken = getAssociatedTokenAddressSync(
    mint,
    STATIC_PUBLICKEY,
  );
  const createStaticWalletTokenAccountIx = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    staticWalletAssociatedToken,
    STATIC_PUBLICKEY,
    mint,
  )
  console.log("Static token account address:", staticWalletAssociatedToken.toBase58());

  return [
    createPayerTokenAccountIx,
    createStaticWalletTokenAccountIx,
    createMintToInstruction(
      mint,
      payerAssociatedToken,
      payer.publicKey,
      100_000_000, // 100 * 10**6
    ),
    createMintToInstruction(
      mint,
      staticWalletAssociatedToken,
      payer.publicKey,
      10_000_000, // 10 * 10**6
    ),
  ];
}

main();
