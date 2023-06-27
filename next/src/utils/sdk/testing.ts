import { Connection, Keypair } from "@solana/web3.js";
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
const connection = new WrapperConnection("https://rpc-devnet.aws.metaplex.com/", "confirmed");

const runFlow = async () => {
  const event = await createEvent(connection, payer, "test", "test");

  console.log(event);

  const mintXP = await createXPUser(
    connection,
    payer.publicKey,
    payer,
    event.tree.treeAddress,
    event.collection.mint,
    event.collection.metadataAccount,
    event.collection.masterEditionAccount,
    "https://8pxsxg-ip-93-215-242-170.tunnelmole.com/api/metadata",
  );

  console.log(mintXP);
};

runFlow();
