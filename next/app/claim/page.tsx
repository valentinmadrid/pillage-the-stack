"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { getProviders, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { WalletMultiButtonDynamic } from "@/src/components/WalletMultiButton";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const Claim: NextPage = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any | null>([]);
  const router = useRouter();
  const wallet = useWallet();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_KEY as string
  );

  useEffect(() => {
    setProfile(null);
    if (wallet.publicKey) {
      const fn = async () => {
        const { data: user } = await supabase
          .from("profiles")
          .select("*")
          .eq("wallet_address", wallet.publicKey?.toBase58());
        console.log("supares", user);
        if (user && user.length > 0) {
          setProfile(user[0]);
          console.log("user", user[0]);
          const stackExchangeId = user[0].stackexchange_id;
          console.log(stackExchangeId);
          const { data: questions } = await supabase
            .from("posted_questions")
            .select("*")
            .eq("claimer", stackExchangeId)
            .eq("claimed", false);
          console.log("questions", questions);
          if (questions) {
            setQuestions(questions);
          }
        }
      };

      fn();
    }
  }, [wallet.publicKey]);

  const handleClaim = async () => {
    const response = await fetch("/api/claimrewards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet_address: wallet.publicKey?.toBase58(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      router.push("/confirmed");
    } else {
      console.error("Error:", response.statusText);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <WalletMultiButtonDynamic
          className="w-full mb-4 py-2 px-4 text-center rounded-lg text-white bg-purple-500 hover:bg-purple-200"
          style={{
            fontWeight: "normal",
            alignContent: "center",
            textAlign: "center",
            width: "100%",
            minWidth: "100%",
            backgroundColor: "#5f2eea",
          }}
        />
        {wallet.publicKey ? (
          profile ? (
            questions.length > 0 ? (
              <div>
                <p>You have these open questions to claim:</p>
                {questions.map((question: any) => {
                  return (
                    <div key={question.id}>
                      <Link href={"/stackexchange_url"}>
                        <p>{question.question_id}</p>
                      </Link>
                    </div>
                  );
                })}
                <button
                  onClick={handleClaim}
                  className="mt-4 mb-4 py-2 px-4 text-center rounded-lg text-white bg-purple-500 hover:bg-purple-600"
                >
                  Claim
                </button>
              </div>
            ) : (
              <p>You have no open questions to claim.</p>
            )
          ) : (
            <Link href={"/"}>
              <p className="text-blue-800 hover:text-blue-400 mt-2 text-md">
                Link your StackExchange Account to your wallet first.
              </p>
            </Link>
          )
        ) : (
          <div>
            <p>Please connect your wallet first</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Claim;
