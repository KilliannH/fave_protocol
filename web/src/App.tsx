import React, { useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";
import LandingPage from "./LandingPage";
import CreatorPage from "./CreatorPage";
import CreateMembership from "./CreateMembership";
import ContractPage from "./ContractPage";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./styles.css";

export default function App() {
  const endpoint = clusterApiUrl("devnet");
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={<CreatorPage />} />
              <Route path="/creator/:address" element={<CreatorPage />} />
              <Route path="/create" element={<CreateMembership />} />
              <Route path="/contract" element={<ContractPage />} />
            </Routes>
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
