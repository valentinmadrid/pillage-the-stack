import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";

interface RequestBody {
  wallet_address: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.status(200).json({
    message: `wazaap`,
  });
}
