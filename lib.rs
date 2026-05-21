use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// Frais du protocole : 2% (200 / 10_000)
const PROTOCOL_FEE_BPS: u64 = 200;
const BPS_DENOMINATOR: u64 = 10_000;

#[program]
pub mod fave_protocol {
    use super::*;

    /// Un créateur initialise sa membership avec un prix par token (en lamports)
    pub fn initialize_membership(
        ctx: Context<InitializeMembership>,
        token_price_lamports: u64,
        name: String,
    ) -> Result<()> {
        require!(token_price_lamports > 0, ErrorCode::InvalidPrice);
        require!(name.len() <= 32, ErrorCode::NameTooLong);

        let membership = &mut ctx.accounts.membership;
        membership.creator = ctx.accounts.creator.key();
        membership.token_price_lamports = token_price_lamports;
        membership.name = name;
        membership.total_sold = 0;
        membership.bump = ctx.bumps.membership;

        emit!(MembershipCreated {
            creator: membership.creator,
            name: membership.name.clone(),
            price: token_price_lamports,
        });

        Ok(())
    }

    /// Un fan achète `quantity` tokens d'un créateur
    /// Le paiement est splitté : 98% créateur, 2% protocole
    pub fn buy_tokens(ctx: Context<BuyTokens>, quantity: u64) -> Result<()> {
        require!(quantity > 0, ErrorCode::InvalidQuantity);

        let membership = &ctx.accounts.membership;
        let total_cost = membership
            .token_price_lamports
            .checked_mul(quantity)
            .ok_or(ErrorCode::Overflow)?;

        let protocol_fee = total_cost
            .checked_mul(PROTOCOL_FEE_BPS)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(ErrorCode::Overflow)?;

        let creator_amount = total_cost
            .checked_sub(protocol_fee)
            .ok_or(ErrorCode::Overflow)?;

        // Paiement au créateur
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.fan.to_account_info(),
                    to: ctx.accounts.creator.to_account_info(),
                },
            ),
            creator_amount,
        )?;

        // Frais protocole
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.fan.to_account_info(),
                    to: ctx.accounts.protocol_treasury.to_account_info(),
                },
            ),
            protocol_fee,
        )?;

        // Enregistrement de l'achat du fan
        let fan_account = &mut ctx.accounts.fan_account;
        fan_account.fan = ctx.accounts.fan.key();
        fan_account.membership = ctx.accounts.membership.key();
        fan_account.tokens_held = fan_account
            .tokens_held
            .checked_add(quantity)
            .ok_or(ErrorCode::Overflow)?;

        // Mise à jour du compteur total
        let membership = &mut ctx.accounts.membership;
        membership.total_sold = membership
            .total_sold
            .checked_add(quantity)
            .ok_or(ErrorCode::Overflow)?;

        emit!(TokensPurchased {
            fan: ctx.accounts.fan.key(),
            creator: membership.creator,
            quantity,
            total_paid: total_cost,
            creator_received: creator_amount,
            protocol_fee,
        });

        Ok(())
    }

    /// Mise à jour du prix par le créateur
    pub fn update_price(
        ctx: Context<UpdatePrice>,
        new_price_lamports: u64,
    ) -> Result<()> {
        require!(new_price_lamports > 0, ErrorCode::InvalidPrice);
        ctx.accounts.membership.token_price_lamports = new_price_lamports;
        Ok(())
    }
}

// --- Comptes ---

#[account]
pub struct Membership {
    pub creator: Pubkey,          // 32
    pub token_price_lamports: u64,// 8
    pub total_sold: u64,          // 8
    pub name: String,             // 4 + 32
    pub bump: u8,                 // 1
}

impl Membership {
    pub const LEN: usize = 8 + 32 + 8 + 8 + (4 + 32) + 1;
}

#[account]
pub struct FanAccount {
    pub fan: Pubkey,        // 32
    pub membership: Pubkey, // 32
    pub tokens_held: u64,   // 8
}

impl FanAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8;
}

// --- Contextes d'instruction ---

#[derive(Accounts)]
#[instruction(token_price_lamports: u64, name: String)]
pub struct InitializeMembership<'info> {
    #[account(
        init,
        payer = creator,
        space = Membership::LEN,
        seeds = [b"fave-membership", creator.key().as_ref()],

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
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
    pub fan: Signer<'info>,

    /// CHECK: adresse du créateur, validée par la contrainte has_one
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    /// CHECK: trésorerie du protocole (adresse fixe)
    #[account(mut)]
    pub protocol_treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(
        mut,
        seeds = [b"fave-membership", creator.key().as_ref()],
}

// --- Erreurs ---

#[error_code]
pub enum ErrorCode {
    #[msg("Le prix doit être supérieur à zéro")]
    InvalidPrice,
    #[msg("La quantité doit être supérieure à zéro")]
    InvalidQuantity,
    #[msg("Débordement arithmétique")]
    Overflow,
    #[msg("Nom trop long (max 32 caractères)")]
    NameTooLong,
}

// --- Événements ---

#[event]
pub struct MembershipCreated {
    pub creator: Pubkey,
    pub name: String,
    pub price: u64,
}

#[event]
pub struct TokensPurchased {
    pub fan: Pubkey,
    pub creator: Pubkey,
    pub quantity: u64,
    pub total_paid: u64,
    pub creator_received: u64,
    pub protocol_fee: u64,
}
