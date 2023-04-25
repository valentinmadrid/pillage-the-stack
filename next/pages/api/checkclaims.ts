import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";

interface RequestBody {
  wallet_address: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_KEY as string
  );

  console.log("HELLO STARTING THIS TEST");

  const { data: unclaimed_questions, error } = await supabase
    .from("posted_questions")
    .select("*")
    .is("claimer", null);

  console.log(unclaimed_questions);

  if (error) {
    return res.status(500).json({
      message: `Error: ${error.message}. Something went wrong here, check if the database accepts connections.`,
    });
  }

  if (unclaimed_questions.length === 0) {
    return res.status(404).json({
      message: `Error: No data found. This means every question has been claimed.`,
    });
  }

  unclaimed_questions.forEach(async (question) => {
    const dem = await fetch(
      `https://api.stackexchange.com/2.3/questions/${question.question_id}/answers?order=desc&sort=activity&site=solana`
    );

    const questionsJson: ApiResponse = await dem.json();

    console.log(questionsJson);
    const acceptedOwner = questionsJson.items
      .filter((item) => item.is_accepted)
      .map((item) => item.owner.account_id);

    console.log(acceptedOwner);

    const { data: add, error } = await supabase.from("profiles").insert([
      {
        stackexchange_id: acceptedOwner[0],
      },
    ]);
    if (error) {
      console.log("User is already in the database, continuing");
    } else {
      console.log("User has been added to the database");
    }

    if (acceptedOwner[0]) {
      console.log("CONTINUING AGAIN");
      console.log("QUESTION", question.question_id);

      const { data: text } = await supabase
        .from("posted_questions")
        .select("*")
        .eq("question_id", question.question_id);
      console.log(text);

      const owner = acceptedOwner[0];

      const { error } = await supabase
        .from("posted_questions")
        .update({ claimer: owner })
        .eq("question_id", question.question_id);

      if (error) {
        return res.status(500).json({
          message: `Error: ${error.message}. Something went wrong here, check if the question is not the regular format.`,
        });
      }
    }
  });

  return res.status(200).json({
    message: `shit that actually worked`,
  });
}

type ApiResponse = {
  items: Array<{
    owner: {
      account_id: number;
      reputation: number;
      user_id: number;
      user_type: string;
      profile_image: string;
      display_name: string;
      link: string;
    };
    is_accepted: boolean;
    score: number;
    last_activity_date: number;
    creation_date: number;
    answer_id: number;
    question_id: number;
    content_license: string;
  }>;
  has_more: boolean;
  quota_max: number;
  quota_remaining: number;
};
