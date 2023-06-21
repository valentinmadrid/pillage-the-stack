import { Wallet } from "@/src/utils/WalletContext";
import "./globals.css";
import Provider from "next-auth";

export const metadata = {
  title: "Pillage the Stack",
  description:
    "A community incentive to reward users that participate in the Solana Stackexchange forums.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Wallet>
        <body>{children}</body>
      </Wallet>
    </html>
  );
}
