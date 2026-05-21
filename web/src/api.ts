const API_URL = import.meta.env.VITE_API_URL || "/api";

export interface Creator {
  id: number;
  wallet_address: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  twitter: string | null;
  youtube: string | null;
  twitch: string | null;
  price_bronze: number;
  price_silver: number;
  price_gold: number;
  total_sold: number;
  verified: boolean;
  created_at: string;
}

export interface Subscription {
  id: number;
  fan_address: string;
  creator_address: string;
  tier: "bronze" | "silver" | "gold";
  expires_at: string;
  tx_signature: string;
  name: string;
  avatar_url: string | null;
}

export interface Stats {
  total_creators: number;
  active_subscriptions: number;
  total_subscriptions: number;
}

// Créateurs
export const getCreators = async (): Promise<Creator[]> => {
  const res = await fetch(`${API_URL}/creators`);
  return res.json();
};

export const getCreator = async (address: string): Promise<Creator | null> => {
  const res = await fetch(`${API_URL}/creators/${address}`);
  if (res.status === 404) return null;
  return res.json();
};

export const registerCreator = async (data: {
  wallet_address: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  twitter?: string;
  youtube?: string;
  twitch?: string;
  price_bronze: number;
  price_silver: number;
  price_gold: number;
}): Promise<Creator> => {
  const res = await fetch(`${API_URL}/creators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateCreator = async (address: string, data: {
  bio?: string;
  avatar_url?: string;
  twitter?: string;
  youtube?: string;
  twitch?: string;
}): Promise<Creator> => {
  const res = await fetch(`${API_URL}/creators/${address}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// Abonnements
export const getSubscriptions = async (fanAddress: string): Promise<Subscription[]> => {
  const res = await fetch(`${API_URL}/subscriptions/${fanAddress}`);
  return res.json();
};

export const registerSubscription = async (data: {
  fan_address: string;
  creator_address: string;
  tier: string;
  expires_at: string;
  tx_signature: string;
}): Promise<Subscription> => {
  const res = await fetch(`${API_URL}/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

// Stats
export const getStats = async (): Promise<Stats> => {
  const res = await fetch(`${API_URL}/stats`);
  return res.json();
};
