"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { getProviders, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { WalletMultiButtonDynamic } from "@/src/components/WalletMultiButton";
import Link from "next/link";

const Home: NextPage = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stackUser, setStackUser] = useState<any | null>(null);

  const access_token = parseAccessTokenFromUrl(window.location.href);

  const wallet = useWallet();

  const handleConnect = () => {
    const clientID = process.env.NEXT_PUBLIC_STACKEXCHANGE_CLIENT_ID || "";
    const redirectURI = "http://localhost:3000/";

    const authURL = `https://stackoverflow.com/oauth/dialog?client_id=${clientID}&redirect_uri=${redirectURI}`;
    router.push(authURL);
  };

  function parseAccessTokenFromUrl(url: string) {
    const hashIndex = url.indexOf("#");
    if (hashIndex === -1) {
      return null;
    }

    const fragment = url.substring(hashIndex + 1);
    const params = new URLSearchParams(fragment);

    return params.get("access_token");
  }

  useEffect(() => {
    const fn = async () => {
      if (access_token) {
        const stackExchangeKey = process.env.NEXT_PUBLIC_STACKEXCHANGE_KEY;

        const userReq = await fetch(
          `https://api.stackexchange.com/2.3/me?access_token=${access_token}&key=${stackExchangeKey}&site=stackoverflow`
        );
        const user = await userReq.json();
        setStackUser(user);
        setAccessToken(access_token);
      }
    };
    fn();
  }, [access_token]);

  const handleLink = async () => {
    const response = await fetch("/api/createuser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet_address: wallet.publicKey?.toBase58(),
        access_token: accessToken,
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
        {accessToken && stackUser ? (
          <>
            <div className="mb-4 flex items-center">
              <img
                src={stackUser.items[0].profile_image}
                alt={stackUser.items[0].display_name}
                className="w-8 h-8 rounded-full mr-2"
              />
              <span>{stackUser.items[0].display_name}</span>
            </div>
            <WalletMultiButtonDynamic
              className="w-full mb-4 py-2 px-4 text-center rounded-lg text-white bg-purple-500 hover:bg-purple-600"
              style={{
                fontWeight: "normal",
                alignContent: "center",
                textAlign: "center",
                width: "100%",
                minWidth: "100%",
              }}
            />

            <button
              className="w-full py-2 px-4 rounded-lg text-purple-500 border border-purple-500 hover:text-white hover:bg-purple-500"
              onClick={handleLink}
            >
              Link Accounts
            </button>
          </>
        ) : (
          <button
            className="w-full py-2 px-4 rounded-lg text-white bg-blue-500 hover:bg-blue-600 items-center text-center"
            onClick={handleConnect}
          >
            Connect to Stackoverflow
          </button>
        )}
      </div>
    </div>
  );
};

export default Home;
