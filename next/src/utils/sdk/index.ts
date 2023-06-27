import { CreateMetadataAccountArgsV3 } from "@metaplex-foundation/mpl-token-metadata";
import { Connection, PublicKey } from "@solana/web3.js";
import { Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { ValidDepthSizePair } from "@solana/spl-account-compression";
import {
  MetadataArgs,
  TokenProgramVersion,
  TokenStandard,
} from "@metaplex-foundation/mpl-bubblegum";
import { createTree } from "./utils/createTree";

// import custom helpers to mint compressed NFTs
import { createCollection } from "./utils/createCollection";

// local import of the connection wrapper, to help with using the ReadApi
import { WrapperConnection } from "./readApi/wrapperConnection";
import { mintCompressedNFT } from "./utils/mintCompressedNFT";

export const createEvent = async (
  connection: Connection,
  payer: Keypair,
  name: string,
  uri: string
) => {
  const maxDepthSizePair: ValidDepthSizePair = {
    // max=16,384 nodes
    maxDepth: 14,
    maxBufferSize: 64,
  };
  const canopyDepth = maxDepthSizePair.maxDepth - 5;

  // tree address
  const treeKeypair = Keypair.generate();

  // create a tree
  const tree = await createTree(
    connection,
    payer,
    treeKeypair,
    maxDepthSizePair,
    canopyDepth
  );

  const collectionMetadataV3: CreateMetadataAccountArgsV3 = {
    data: {
      name: name,
      symbol: "PRESTIGE",
      // specific json metadata for the collection
      uri: uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: true,
    collectionDetails: null,
  };
  // create the collection
  const collection = await createCollection(
    connection,
    payer,
    collectionMetadataV3
  );

  return { tree, collection };
};

export const createXPUser = async (
  connection: WrapperConnection,
  address: PublicKey,
  payer: Keypair,
  treeAddress: PublicKey,
  collectionMint: PublicKey,
  collectionMetadataAccount: PublicKey,
  collectionMasterEditionAccount: PublicKey,
  uri: string
) => {
  const asset = await connection.getAssetsByGroup({
    groupKey: "collection",
    groupValue: collectionMint.toBase58(),
    sortBy: {
      sortBy: "recent_action",
      sortDirection: "asc",
    },
  });

  try {
    const res = await connection.getAssetsByGroup({
      groupKey: "collection",
      groupValue: collectionMint.toBase58(),
      sortBy: {
        sortBy: "recent_action",
        sortDirection: "asc",
      },
    });

    console.log("Total assets returned:", res.total);

    if (res.items) {
      for (let i = 0; i < res.items.length; i++) {
        if (res.items[i].ownership.owner === address.toBase58()) {
          return Error("User already has an NFT for this event.");
        }
      }
    }
  } catch (error) {
    console.error(error);
    return Error("Error checking if user already has an NFT for this event.");
  }

  const compressedNFTMetadata: MetadataArgs = {
    name: "Stackexchange XP NFT",
    symbol: "PILLAGE",
    // specific json metadata for each NFT
    uri: uri,
    sellerFeeBasisPoints: 0,
    creators: [],
    editionNonce: 0,
    uses: null,
    collection: null,
    primarySaleHappened: false,
    isMutable: true,
    // values taken from the Bubblegum package
    tokenProgramVersion: TokenProgramVersion.Original,
    tokenStandard: TokenStandard.NonFungible,
  };
  // check if the user already has an NFT in that collection
  // if not, create a new XPUser by minting an NFT to the collection

  const mintToPayer = await mintCompressedNFT(
    connection,
    payer,
    treeAddress,
    collectionMint,
    collectionMetadataAccount,
    collectionMasterEditionAccount,
    compressedNFTMetadata,
    // mint to this wallet
    address
  );

  return mintToPayer;
};
