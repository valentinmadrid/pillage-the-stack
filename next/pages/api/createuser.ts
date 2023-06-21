import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";

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
    const { data, error } = await supabase.from("profiles").insert([
      {
        wallet_address: wallet_address,
        stackexchange_id: user.items[0].account_id,
        total_xp: 0,
      },
    ]);
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }
    // mint compressed NFT to user
    return res.status(200).json({
      message: `Hello, account with ${wallet_address} has been created!`,
    });
  }
}
