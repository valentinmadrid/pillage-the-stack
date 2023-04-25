import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi, TwitterApiv2 } from "twitter-api-v2";

interface RequestBody {
  wallet_address: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const appKey = process.env.TWITTER_API_KEY as string;
  console.log(appKey);
  const appSecret = process.env.TWITTER_API_SECRET as string;
  console.log(appSecret);
  const accessToken = process.env.TWITTER_BEARER_TOKEN as string;

  const twitter = new TwitterApi({
    appKey,
    appSecret,
    accessToken: "1638913735874998272-0KC5vkDbiZs4ytv6HcLNrUD7VBi6Oz",
    accessSecret: "PFwrMj3JHoJQSLgZbMmcp5BRU5TlNg3SMf7HGdbb41nZZ",
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
  const questionId = randomQuestion.question_id;
  const questionLink = randomQuestion.link;
  const { data, error } = await supabase.from("posted_questions").insert([
    {
      question_id: questionId,
      question_url: questionLink,
      claimed: false,
      claimer: null,
    },
  ]);
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const questionTitle = randomQuestion.title;
  console.log(questionTitle);

  console.log(questionLink);
  const tweet = await rwClient.v2.tweet(
    `Hey Solana devs, there is a new question to be answered: ${questionTitle}. The link to this is: ${questionLink}`
  );
  if (!tweet) {
    return res.status(400).json({
      message: "Couldnt tweet",
    });
  }

  return res.status(200).json({
    message: `shit that actually worked`,
  });
}
