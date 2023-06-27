import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { createXPUser } from "../../src/utils/sdk/index";
import { WrapperConnection } from "../../src/utils/sdk/readApi/wrapperConnection";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

interface RequestBody {
  wallet_address: string;
  access_token: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { wallet_address, access_token }: RequestBody = req.body;
  const stackExchangeKey = process.env.NEXT_PUBLIC_STACKEXCHANGE_KEY;
  const userReq = await fetch(
    `https://api.stackexchange.com/2.3/me?access_token=${access_token}&key=${stackExchangeKey}&site=stackoverflow`
  );
  const user = await userReq.json();
  if (!user) {
    return res.status(400).json({
      message: "Invalid access token",
    });
  } else if (user && user.items[0].account_id) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.PRIVATE_SUPABASE_KEY as string
    );
    console.log("CREATED CLIENT");
    const { data, error } = await supabase.from("profiles").upsert([
      {
        wallet_address: wallet_address,
        stackexchange_id: user.items[0].account_id,
      },
    ]);
    console.log("INSERTED INTO SUPABASE");
    if (error) {
      console.error(error);
      return res.status(400).json({
        message: error.message,
      });
    }

    console.log("MINTING NFTTTTTTTTT");
    // mint cNFT to user
    const event = {
      tree: {
        treeAddress: new PublicKey(
          "2knN5TFw8ecwUTwzVnfxTGbn2G4MocDMjv851cyANQs6"
        ),
      },
      collection: {
        mint: new PublicKey("zGAb8mSnbzCSYi4wCqawTDL96drXyF8KMw39XmYGHWE"),
        metadataAccount: new PublicKey(
          "AMS2neCaaSXZJkwpHVfPLutD51NW4USumA24rY52HT8M"
        ),
        masterEditionAccount: new PublicKey(
          "wvQgKWjGv8tB56Rt7ETSNNqE6pLFAN28LN8Mwe2EiTc"
        ),
      },
    };
    const CNFT_RPC_URL = process.env.HELIUS_RPC_URL as string;
    const wrapperConnection = new WrapperConnection(CNFT_RPC_URL, "confirmed");
    const byteArray = process.env.REWARD_PRIVATE_KEY.split(",").map(
      (num) => +num
    );

    // Create the keypair from the Uint8Array
    let keypair;
    try {
      keypair = Keypair.fromSecretKey(new Uint8Array(byteArray));
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to load key pair" });
    }

    createXPUser(
      wrapperConnection,
      new PublicKey(wallet_address),
      keypair,
      event.tree.treeAddress,
      event.collection.mint,
      event.collection.metadataAccount,
      event.collection.masterEditionAccount,
      "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/nft.json"
    );

    console.log("Creating XP user called...");
    return res.status(200).json({
      message: `Hello, account with ${wallet_address} has been created!`,
    });
  }
}
