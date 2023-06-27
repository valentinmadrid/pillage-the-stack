import {
  CreateMetadataAccountArgsV3,
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
  createSetCollectionSizeInstruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  // @ts-ignore
  createMint,
  // @ts-ignore
  createAccount,
  // @ts-ignore
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export async function createCollection(
  connection: Connection,
  payer: Keypair,
  metadataV3: CreateMetadataAccountArgsV3
) {
  // create and initialize the SPL token mint
  console.log("Creating the collection's mint...");
  const mint = await createMint(
    connection,
    payer,
    // mint authority
    payer.publicKey,
    // freeze authority
    payer.publicKey,
    // decimals - use `0` for NFTs since they are non-fungible
    0
  );
  console.log("Mint address:", mint.toBase58());

  // create the token account
  console.log("Creating a token account...");
  const tokenAccount = await createAccount(
    connection,
    payer,
    mint,
    payer.publicKey
    // undefined, undefined,
  );
  console.log("Token account:", tokenAccount.toBase58());

  // mint 1 token ()
  console.log("Minting 1 token for the collection...");
  const mintSig = await mintTo(
    connection,
    payer,
    mint,
    tokenAccount,
    payer,
    // mint exactly 1 token
    1,
    // no `multiSigners`
    [],
    undefined,
    TOKEN_PROGRAM_ID
  );
  // console.log(explorerURL({ txSignature: mintSig }));

  // derive the PDA for the metadata account
  const [metadataAccount, _bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  console.log("Metadata account:", metadataAccount.toBase58());

  // create an instruction to create the metadata account
  const createMetadataIx = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: metadataV3,
    }
  );

  // derive the PDA for the metadata account
  const [masterEditionAccount, _bump2] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata", "utf8"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition", "utf8"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  console.log("Master edition account:", masterEditionAccount.toBase58());

  // create an instruction to create the metadata account
  const createMasterEditionIx = createCreateMasterEditionV3Instruction(
    {
      edition: masterEditionAccount,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
      metadata: metadataAccount,
    },
    {
      createMasterEditionArgs: {
        maxSupply: 0,
      },
    }
  );

  // create the collection size instruction
  const collectionSizeIX = createSetCollectionSizeInstruction(
    {
      collectionMetadata: metadataAccount,
      collectionAuthority: payer.publicKey,
      collectionMint: mint,
    },
    {
      setCollectionSizeArgs: { size: 50 },
    }
  );

  try {
    // construct the transaction with our instructions, making the `payer` the `feePayer`
    const tx = new Transaction()
      .add(createMetadataIx)
      .add(createMasterEditionIx)
      .add(collectionSizeIX);
    tx.feePayer = payer.publicKey;

    // send the transaction to the cluster
    const txSignature = await sendAndConfirmTransaction(
      connection,
      tx,
      [payer],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    );

    console.log("\nCollection successfully created!");
    console.log("your tx sig", txSignature);
  } catch (err) {
    console.error("\nFailed to create collection:", err);

    throw err;
  }

  // return all the accounts
  return { mint, tokenAccount, metadataAccount, masterEditionAccount };
}
