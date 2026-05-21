# Fave Protocol — $FAVE — Smart Contract Solana

Protocole de monétisation directe pour créateurs de contenu.  
Un créateur déploie sa membership, les fans achètent des tokens.  
Split automatique : **98% créateur / 2% protocole**.

## Stack

- Solana (blockchain)
- Anchor 0.30 (framework smart contracts en Rust)
- TypeScript (tests)

## Installation

```bash
# 1. Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana-keygen new  # génère ton wallet local

# 2. Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest && avm use latest

# 3. Dépendances Node
yarn install
```

## Démarrer en local

```bash
# Terminal 1 — lance un validateur Solana local
solana-test-validator

# Terminal 2 — build et deploy
anchor build
anchor deploy

# Lancer les tests
anchor test
```

## Architecture du contrat

### Comptes (données on-chain)

**`Membership`** — créé par le créateur, 1 par créateur
```
creator            : Pubkey   — propriétaire
token_price_lamports: u64     — prix par token en lamports
total_sold         : u64      — tokens vendus au total
name               : String   — nom de la chaîne (max 32 chars)
bump               : u8       — PDA bump
```

**`FanAccount`** — créé au premier achat, 1 par (fan × créateur)
```
fan                : Pubkey   — adresse du fan
membership         : Pubkey   — membership associée
tokens_held        : u64      — tokens détenus
```

### Instructions

| Instruction | Qui | Ce que ça fait |
|---|---|---|
| `initialize_membership` | Créateur | Déploie sa membership avec un prix |
| `buy_tokens` | Fan | Achète N tokens, split 98/2% automatique |
| `update_price` | Créateur | Met à jour le prix d'un token |

### PDAs (adresses dérivées)

```
Membership : ["membership", creator_pubkey]
FanAccount : ["fan", fan_pubkey, membership_pubkey]
```

## Prochaines étapes

- [ ] Intégration SPL Token (token fongible ERC-20-like sur Solana)
- [ ] Niveaux de membership (Bronze/Silver/Gold)
- [ ] Expiration des tokens (abonnement mensuel)
- [ ] SDK JavaScript pour l'intégration front-end
- [ ] Déploiement sur Devnet puis Mainnet
