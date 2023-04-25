import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";

interface RequestBody {
  wallet_address: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const appKey = process.env.TWITTER_API_KEY as string;

  const appSecret = process.env.TWITTER_API_SECRET as string;

  const accessToken = process.env.TWITTER_ACCESS_TOKEN as string;

  const accessSecret = process.env.TWITTER_ACCESS_SECRET as string;

  const twitter = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });

  const rwClient = twitter.readWrite;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_KEY as string
  );

  const questions = await fetch(
    "https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&filter=default&site=solana"
  );
  console.log(questions);
  const questionsJson = await questions.json();
  const unansweredQuestions = questionsJson.items.filter(
    (question: any) => question.answer_count === 0
  );

  const randomQuestion =
    unansweredQuestions[Math.floor(Math.random() * unansweredQuestions.length)];

  const questionTitle = randomQuestion.title;
  console.log(questionTitle);
  const questionLink = randomQuestion.link;
  console.log(questionLink);
  const tweet = await rwClient.v1.tweet(
    `Hey Solana devs, ${questionTitle} ${questionLink}`
  );
  if (!tweet) {
    return res.status(400).json({
      message: "Couldnt tweet",
    });
  }

  const questionId = randomQuestion.question_id;
  console.log(questionId);

  const { data, error } = await supabase.from("posted_questions").insert([
    {
      question_id: questionId,
      question_url: questionLink,
    },
  ]);
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  return res.status(200).json({
    message: `shit that actually worked`,
  });
}
