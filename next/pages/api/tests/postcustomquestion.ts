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

  const id = 6443;
  const url = "https://stackoverflow.com/questions/6443";
  const { data, error } = await supabase.from("posted_questions").insert([
    {
      question_id: id,
      question_url: url,
      claimed: false,
      claimer: null,
    },
  ]);
  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
  /*
  const tweet = await rwClient.v2.tweet(
    `This is just a Test Tweet. Pillage the Stack will soon be released. Stay tuned!`
  );
  if (!tweet) {
    return res.status(400).json({
      message: "Couldnt tweet",
    });
    
  }
*/
  return res.status(200).json({
    message: `shit that actually worked`,
  });
}
