import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";

interface RequestBody {
  wallet_address: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { wallet_address }: RequestBody = req.body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.PRIVATE_SUPABASE_KEY as string
  );

  const { data: user, error } = await supabase
    .from("profiles")
    .select("stackexchange_id")
    .eq("wallet_address", wallet_address)
    .single();

  if (error) {
    return res.status(500).json({
      message: `Error: ${error.message}. It's very likely that you have not linked your wallet to a StackExchange account.`,
    });
  }

  if (!user) {
    return res.status(404).json({
      message: `Error: No data found. It's very likely that you have not linked your wallet to a StackExchange account.`,
    });
  }

  const { stackexchange_id } = user;

  const { data: questions, error: error2 } = await supabase
    .from("posted_questions")
    .select("*")
    .eq("claimer", stackexchange_id)
    .eq("claimed", false);

  if (error2) {
    return res.status(500).json({
      message: `Error: ${error2.message}.`,
    });
  }

  if (!questions) {
    return res.status(404).json({
      message: `Error: No data found.`,
    });
  }

  questions.forEach(async (question) => {
    const { error } = await supabase
      .from("posted_questions")
      .update({ claimed: true })
      .eq("id", question.id);

    if (error) {
      return res.status(500).json({
        message: `Error: ${error.message}`,
      });
    }
  });

  return res.status(200).json({
    message: `shit that actually worked`,
  });
}
