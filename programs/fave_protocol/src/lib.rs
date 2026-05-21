use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("3qqA8JTRKQ28AZmqzs9bqSonsJGJjybaTdChKV1HneeU");

const PROTOCOL_FEE_BPS: u64 = 200;
const BPS_DENOMINATOR: u64 = 10_000;
const SECONDS_PER_MONTH: i64 = 30 * 24 * 60 * 60;

#[program]
pub mod fave_protocol {
    use super::*;

    /// Initialise la membership d'un créateur avec 3 niveaux et leurs mints SPL
    pub fn initialize_membership(
        ctx: Context<InitializeMembership>,
        name: String,
        price_bronze: u64,
        price_silver: u64,
        price_gold: u64,
    ) -> Result<()> {
        require!(name.len() <= 32, ErrorCode::NameTooLong);
        require!(price_bronze > 0 && price_silver > price_bronze && price_gold > price_silver, ErrorCode::InvalidPrice);

        let membership = &mut ctx.accounts.membership;
        membership.creator = ctx.accounts.creator.key();
        membership.name = name;
        membership.price_bronze = price_bronze;
        membership.price_silver = price_silver;
        membership.price_gold = price_gold;
        membership.mint_bronze = ctx.accounts.mint_bronze.key();
        membership.mint_silver = ctx.accounts.mint_silver.key();
        membership.mint_gold = ctx.accounts.mint_gold.key();
        membership.total_sold = 0;
        membership.bump = ctx.bumps.membership;

        emit!(MembershipCreated {
            creator: membership.creator,
            name: membership.name.clone(),
        });

        Ok(())
    }

    /// Un fan achète un abonnement d'un mois pour un niveau donné
    /// Reçoit des SPL tokens en échange, valables 30 jours
    pub fn buy_subscription(
        ctx: Context<BuySubscription>,
        tier: Tier,
    ) -> Result<()> {
        let membership = &ctx.accounts.membership;
        let price = match tier {
            Tier::Bronze => membership.price_bronze,
            Tier::Silver => membership.price_silver,
            Tier::Gold => membership.price_gold,
        };

        // Split 98% créateur / 2% protocole
        let protocol_fee = price
            .checked_mul(PROTOCOL_FEE_BPS).ok_or(ErrorCode::Overflow)?
            .checked_div(BPS_DENOMINATOR).ok_or(ErrorCode::Overflow)?;
        let creator_amount = price.checked_sub(protocol_fee).ok_or(ErrorCode::Overflow)?;

        // Paiement SOL au créateur
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.fan.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
            ),
            creator_amount,
        )?;

        // Frais protocole
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.fan.to_account_info(),
                    to: ctx.accounts.protocol_treasury.to_account_info(),
                },
            ),
            protocol_fee,
        )?;

        // Mint 1 SPL token au fan (représente son abonnement)
        let creator_key = ctx.accounts.creator.key();
        let seeds = &[
            b"fave-membership",
            creator_key.as_ref(),
            &[membership.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.fan_token_account.to_account_info(),
                    authority: ctx.accounts.membership.to_account_info(),
                },
                signer_seeds,
            ),
            1,
        )?;

        // Met à jour ou crée le compte fan avec expiration
        let fan_account = &mut ctx.accounts.fan_account;
        let now = Clock::get()?.unix_timestamp;
        fan_account.fan = ctx.accounts.fan.key();
        fan_account.membership = ctx.accounts.membership.key();
        fan_account.tier = tier.clone();

        // Si l'abo est encore actif, on prolonge depuis expires_at
        // Sinon on repart de maintenant
        if fan_account.expires_at > now {
            fan_account.expires_at = fan_account.expires_at
                .checked_add(SECONDS_PER_MONTH).ok_or(ErrorCode::Overflow)?;
        } else {
            fan_account.expires_at = now
                .checked_add(SECONDS_PER_MONTH).ok_or(ErrorCode::Overflow)?;
        }

        let membership = &mut ctx.accounts.membership;
        membership.total_sold = membership.total_sold
            .checked_add(1).ok_or(ErrorCode::Overflow)?;

        emit!(SubscriptionPurchased {
            fan: ctx.accounts.fan.key(),
            creator: membership.creator,
            tier,
            price,
            expires_at: fan_account.expires_at,
        });

        Ok(())
    }

    /// Vérifie si un fan a un abonnement actif (lecture seule)
    pub fn check_subscription(ctx: Context<CheckSubscription>) -> Result<bool> {
        let now = Clock::get()?.unix_timestamp;
        let is_active = ctx.accounts.fan_account.expires_at > now;
        Ok(is_active)
    }

    /// Mise à jour des prix par le créateur
    pub fn update_prices(
        ctx: Context<UpdatePrices>,
        price_bronze: u64,
        price_silver: u64,
        price_gold: u64,
    ) -> Result<()> {
        require!(price_bronze > 0 && price_silver > price_bronze && price_gold > price_silver, ErrorCode::InvalidPrice);
        let m = &mut ctx.accounts.membership;
        m.price_bronze = price_bronze;
        m.price_silver = price_silver;
        m.price_gold = price_gold;
        Ok(())
    }
}

// --- Types ---

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum Tier {
    Bronze,
    Silver,
    Gold,
}

// --- Comptes ---

#[account]
pub struct Membership {
    pub creator: Pubkey,       // 32
    pub name: String,          // 4+32
    pub price_bronze: u64,     // 8
    pub price_silver: u64,     // 8
    pub price_gold: u64,       // 8
    pub mint_bronze: Pubkey,   // 32
    pub mint_silver: Pubkey,   // 32
    pub mint_gold: Pubkey,     // 32
    pub total_sold: u64,       // 8
    pub bump: u8,              // 1
}

impl Membership {
    pub const LEN: usize = 8 + 32 + (4+32) + 8 + 8 + 8 + 32 + 32 + 32 + 8 + 1;
}

#[account]
pub struct FanAccount {
    pub fan: Pubkey,           // 32
    pub membership: Pubkey,    // 32
    pub tier: Tier,            // 1
    pub expires_at: i64,       // 8
}

impl FanAccount {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8;
}

// --- Contextes ---

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeMembership<'info> {
    #[account(
        init,
        payer = creator,
        space = Membership::LEN,
        seeds = [b"fave-membership", creator.key().as_ref()],
        bump
    )]
    pub membership: Account<'info, Membership>,

    #[account(
        init,
        payer = creator,
        mint::decimals = 0,
        mint::authority = membership,
        seeds = [b"fave-mint-bronze", creator.key().as_ref()],
        bump
    )]
    pub mint_bronze: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        mint::decimals = 0,
        mint::authority = membership,
        seeds = [b"fave-mint-silver", creator.key().as_ref()],
        bump
    )]
    pub mint_silver: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        mint::decimals = 0,
        mint::authority = membership,
        seeds = [b"fave-mint-gold", creator.key().as_ref()],
        bump
    )]
    pub mint_gold: Account<'info, Mint>,

    #[account(mut)]
    pub creator: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(tier: Tier)]
pub struct BuySubscription<'info> {
    #[account(
        mut,
        seeds = [b"fave-membership", creator.key().as_ref()],
        bump = membership.bump,
        has_one = creator,
    )]
    pub membership: Account<'info, Membership>,

    #[account(
        init_if_needed,
        payer = fan,
        space = FanAccount::LEN,
        seeds = [b"fave-fan", fan.key().as_ref(), membership.key().as_ref()],
        bump
    )]
    pub fan_account: Account<'info, FanAccount>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = fan,
        associated_token::mint = mint,
        associated_token::authority = fan,
    )]
    pub fan_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub fan: Signer<'info>,

    /// CHECK: validé par has_one
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    /// CHECK: trésorerie protocole
    #[account(mut)]
    pub protocol_treasury: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CheckSubscription<'info> {
    #[account(
        seeds = [b"fave-fan", fan.key().as_ref(), membership.key().as_ref()],
        bump,
        has_one = fan,
        has_one = membership,
    )]
    pub fan_account: Account<'info, FanAccount>,
    pub fan: SystemAccount<'info>,
    pub membership: Account<'info, Membership>,
}

#[derive(Accounts)]
pub struct UpdatePrices<'info> {
    #[account(
        mut,
        seeds = [b"fave-membership", creator.key().as_ref()],
        bump = membership.bump,
        has_one = creator,
    )]
    pub membership: Account<'info, Membership>,
    pub creator: Signer<'info>,
}

// --- Erreurs ---

#[error_code]
pub enum ErrorCode {
    #[msg("Prix invalide — bronze < silver < gold requis")]
    InvalidPrice,
    #[msg("Débordement arithmétique")]
    Overflow,
    #[msg("Nom trop long (max 32 caractères)")]
    NameTooLong,
    #[msg("Mauvais mint pour ce tier")]
    WrongMint,
}

// --- Événements ---

#[event]
pub struct MembershipCreated {
    pub creator: Pubkey,
    pub name: String,
}

#[event]
pub struct SubscriptionPurchased {
    pub fan: Pubkey,
    pub creator: Pubkey,
    pub tier: Tier,
    pub price: u64,
    pub expires_at: i64,
}
