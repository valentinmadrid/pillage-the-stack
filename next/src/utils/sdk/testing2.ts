import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { createEvent, createXPUser } from ".";
import { WrapperConnection } from "./readApi/wrapperConnection";

const loadKeypairFromFile = () => {
  // load the payer's keypair from a file
  const keypair = Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(
        require("fs").readFileSync("/Users/devenv/.config/solana/id.json", {
          encoding: "utf-8",
        }),
      ),
    ),
  );
  return keypair;
};

const payer = loadKeypairFromFile();
// solana devnet connection
const connection = new WrapperConnection(
  "https://rpc-devnet.helius.xyz/?api-key=f02e497e-38c7-4409-8194-f1a0d9f2d72e",
  "confirmed",
);

const runFlow = async () => {
  // const event = await createEvent(connection, payer, "test", "test");

  const event = {
    tree: {
      treeAddress: new PublicKey("2knN5TFw8ecwUTwzVnfxTGbn2G4MocDMjv851cyANQs6"),
    },
    collection: {
      mint: new PublicKey("zGAb8mSnbzCSYi4wCqawTDL96drXyF8KMw39XmYGHWE"),
      metadataAccount: new PublicKey("AMS2neCaaSXZJkwpHVfPLutD51NW4USumA24rY52HT8M"),
      masterEditionAccount: new PublicKey("wvQgKWjGv8tB56Rt7ETSNNqE6pLFAN28LN8Mwe2EiTc"),
    },
  };

  const mintXP = await createXPUser(
    connection,
    payer.publicKey,
    payer,
    event.tree.treeAddress,
    event.collection.mint,
    event.collection.metadataAccount,
    event.collection.masterEditionAccount,
    "https://xeiuaj-ip-93-215-242-170.tunnelmole.com/api/metadata",
  );

  console.log(mintXP);
};

runFlow();
