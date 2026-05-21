export const IDL = {
  "address": "3qqA8JTRKQ28AZmqzs9bqSonsJGJjybaTdChKV1HneeU",
  "metadata": {
    "name": "fave_protocol",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "buy_subscription",
      "docs": [
        "Un fan achète un abonnement d'un mois pour un niveau donné",
        "Reçoit des SPL tokens en échange, valables 30 jours"
      ],
      "discriminator": [
        27,
        182,
        85,
        238,
        225,
        225,
        177,
        252
      ],
      "accounts": [
        {
          "name": "membership",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  118,
                  101,
                  45,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "fan_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  118,
                  101,
                  45,
                  102,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "fan"
              },
              {
                "kind": "account",
                "path": "membership"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "fan_token_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "fan"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "fan",
          "writable": true,
          "signer": true
        },
        {
          "name": "creator",
          "writable": true,
          "relations": [
            "membership"
          ]
        },
        {
          "name": "protocol_treasury",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associated_token_program",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "tier",
          "type": {
            "defined": {
              "name": "Tier"
            }
          }
        }
      ]
    },
    {
      "name": "check_subscription",
      "docs": [
        "Vérifie si un fan a un abonnement actif (lecture seule)"
      ],
      "discriminator": [
        219,
        133,
        12,
        68,
        26,
        101,
        56,
        138
      ],
      "accounts": [
        {
          "name": "fan_account",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  118,
                  101,
                  45,
                  102,
                  97,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "fan"
              },
              {
                "kind": "account",
                "path": "membership"
              }
            ]
          }
        },
        {
          "name": "fan",
          "relations": [
            "fan_account"
          ]
        },
        {
          "name": "membership",
          "relations": [
            "fan_account"
          ]
        }
      ],
      "args": [],
      "returns": "bool"
    },
    {
      "name": "initialize_membership",
      "docs": [
        "Initialise la membership d'un créateur avec 3 niveaux et leurs mints SPL"
      ],
      "discriminator": [
        248,
        100,
        160,
        218,
        25,
        161,
        175,
        208
      ],
      "accounts": [
        {
          "name": "membership",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  118,
                  101,
                  45,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "mint_bronze",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  118,
                  101,
                  45,
                  109,
                  105,
                  110,
                  116,
                  45,
                  98,
                  114,
                  111,
                  110,
                  122,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "mint_silver",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  118,
                  101,
                  45,
                  109,
                  105,
                  110,
                  116,
                  45,
                  115,
                  105,
                  108,
                  118,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "mint_gold",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  118,
                  101,
                  45,
                  109,
                  105,
                  110,
                  116,
                  45,
                  103,
                  111,
                  108,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "price_bronze",
          "type": "u64"
        },
        {
          "name": "price_silver",
          "type": "u64"
        },
        {
          "name": "price_gold",
          "type": "u64"
        }
      ]
    },
    {
      "name": "update_prices",
      "docs": [
        "Mise à jour des prix par le créateur"
      ],
      "discriminator": [
        62,
        161,
        234,
        136,
        106,
        26,
        18,
        160
      ],
      "accounts": [
        {
          "name": "membership",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  118,
                  101,
                  45,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "creator",
          "signer": true,
          "relations": [
            "membership"
          ]
        }
      ],
      "args": [
        {
          "name": "price_bronze",
          "type": "u64"
        },
        {
          "name": "price_silver",
          "type": "u64"
        },
        {
          "name": "price_gold",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "FanAccount",
      "discriminator": [
        121,
        23,
        32,
        50,
        97,
        66,
        56,
        73
      ]
    },
    {
      "name": "Membership",
      "discriminator": [
        231,
        141,
        180,
        98,
        109,
        168,
        175,
        166
      ]
    }
  ],
  "events": [
    {
      "name": "MembershipCreated",
      "discriminator": [
        171,
        142,
        170,
        18,
        249,
        131,
        55,
        222
      ]
    },
    {
      "name": "SubscriptionPurchased",
      "discriminator": [
        227,
        166,
        27,
        212,
        191,
        41,
        220,
        107
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidPrice",
      "msg": "Prix invalide — bronze < silver < gold requis"
    },
    {
      "code": 6001,
      "name": "Overflow",
      "msg": "Débordement arithmétique"
    },
    {
      "code": 6002,
      "name": "NameTooLong",
      "msg": "Nom trop long (max 32 caractères)"
    },
    {
      "code": 6003,
      "name": "WrongMint",
      "msg": "Mauvais mint pour ce tier"
    }
  ],
  "types": [
    {
      "name": "FanAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fan",
            "type": "pubkey"
          },
          {
            "name": "membership",
            "type": "pubkey"
          },
          {
            "name": "tier",
            "type": {
              "defined": {
                "name": "Tier"
              }
            }
          },
          {
            "name": "expires_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "Membership",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "price_bronze",
            "type": "u64"
          },
          {
            "name": "price_silver",
            "type": "u64"
          },
          {
            "name": "price_gold",
            "type": "u64"
          },
          {
            "name": "mint_bronze",
            "type": "pubkey"
          },
          {
            "name": "mint_silver",
            "type": "pubkey"
          },
          {
            "name": "mint_gold",
            "type": "pubkey"
          },
          {
            "name": "total_sold",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "MembershipCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "SubscriptionPurchased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "fan",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "tier",
            "type": {
              "defined": {
                "name": "Tier"
              }
            }
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "expires_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "Tier",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Bronze"
          },
          {
            "name": "Silver"
          },
          {
            "name": "Gold"
          }
        ]
      }
    }
  ]
} as const;
export default IDL;
