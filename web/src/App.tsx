import React, { useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { clusterApiUrl } from "@solana/web3.js";
import LandingPage from "./LandingPage";
import CreatorPage from "./CreatorPage";
import CreatorsPage from "./CreatorsPage";
import CreateMembership from "./CreateMembership";
import ContractPage from "./ContractPage";
import ProfilePage from "./ProfilePage";
import DashboardPage from "./DashboardPage";
import { NETWORK } from "./constants";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./styles.css";

export default function App() {
  const endpoint = clusterApiUrl(NETWORK as any);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/creators" element={<CreatorsPage />} />
              <Route path="/creator/:address" element={<CreatorPage />} />
              <Route path="/create" element={<CreateMembership />} />
              <Route path="/contract" element={<ContractPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dashboard/:address" element={<DashboardPage />} />
            </Routes>
          </BrowserRouter>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
