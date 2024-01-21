import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";
import { TwitterApi } from "twitter-api-v2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestPassword = req.query.password;

  if (requestPassword !== process.env.POST_TWEET_PASSWORD) {
    return res.status(401).json({ message: "Invalid password" });
  }
  // Twitter API setup
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

  // Supabase client setup
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.PRIVATE_SUPABASE_KEY as string
  );

  try {
    // Fetching questions from StackExchange
    const response = await fetch(
      "https://api.stackexchange.com/2.3/questions?order=desc&sort=creation&site=solana"
    );
    const questionsJson = await response.json();
    const questions = questionsJson.items;

    // Process each question
    for (const question of questions) {
      const questionId = question.question_id;

      // Check if the question has already been posted
      const { data, error } = await supabase
        .from("posted_questions")
        .select("question_id")
        .eq("question_id", questionId);

      if (error) {
        throw new Error(`Error querying Supabase: ${error.message}`);
      }

      console.log("data is", data);

      if (data.length > 0) {
        // Question already posted, skip to the next one
        console.log(`Question ID ${questionId} already posted.`);
        continue;
      }

      console.log(`Posting question ID ${questionId}...`);
      //   // Post to Twitter
      //   const tweet = await rwClient.v2.tweet(
      //     `Gm Solana devs,\nThere is a new question on Stackexchange:\n"${question.title}"\n${question.link}`
      //   );

      //   if (!tweet) {
      //     throw new Error("Could not post tweet");
      //   }

      // Save to Supabase
      const { error: insertError } = await supabase
        .from("posted_questions")
        .insert([
          {
            question_id: questionId,
            question_url: question.link,
            claimed: false,
            claimer: null,
            xp: 10,
          },
        ]);

      if (insertError) {
        throw new Error(`Error saving to Supabase: ${insertError.message}`);
      }
    }

    return res.status(200).json({ message: "Process completed" });
  } catch (e) {
    console.error(e);
    // @ts-ignore
    return res.status(500).json({ error: e.message });
  }
}
