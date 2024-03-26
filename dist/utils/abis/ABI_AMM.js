export const ABI_AMM = [
    {
        name: "TokenExchange",
        inputs: [
            {
                name: "buyer",
                type: "address",
                indexed: true,
            },
            {
                name: "sold_id",
                type: "uint256",
                indexed: false,
            },
            {
                name: "tokens_sold",
                type: "uint256",
                indexed: false,
            },
            {
                name: "bought_id",
                type: "uint256",
                indexed: false,
            },
            {
                name: "tokens_bought",
                type: "uint256",
                indexed: false,
            },
        ],
        anonymous: false,
        type: "event",
    },
    {
        name: "Deposit",
        inputs: [
            {
                name: "provider",
                type: "address",
                indexed: true,
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
            },
            {
                name: "n1",
                type: "int256",
                indexed: false,
            },
            {
                name: "n2",
                type: "int256",
                indexed: false,
            },
        ],
        anonymous: false,
        type: "event",
    },
    {
        name: "Withdraw",
        inputs: [
            {
                name: "provider",
                type: "address",
                indexed: true,
            },
            {
                name: "amount_borrowed",
                type: "uint256",
                indexed: false,
            },
            {
                name: "amount_collateral",
                type: "uint256",
                indexed: false,
            },
        ],
        anonymous: false,
        type: "event",
    },
    {
        name: "SetRate",
        inputs: [
            {
                name: "rate",
                type: "uint256",
                indexed: false,
            },
            {
                name: "rate_mul",
                type: "uint256",
                indexed: false,
            },
            {
                name: "time",
                type: "uint256",
                indexed: false,
            },
        ],
        anonymous: false,
        type: "event",
    },
    {
        name: "SetFee",
        inputs: [
            {
                name: "fee",
                type: "uint256",
                indexed: false,
            },
        ],
        anonymous: false,
        type: "event",
    },
    {
        name: "SetAdminFee",
        inputs: [
            {
                name: "fee",
                type: "uint256",
                indexed: false,
            },
        ],
        anonymous: false,
        type: "event",
    },
    {
        stateMutability: "nonpayable",
        type: "constructor",
        inputs: [
            {
                name: "_borrowed_token",
                type: "address",
            },
            {
                name: "_borrowed_precision",
                type: "uint256",
            },
            {
                name: "_collateral_token",
                type: "address",
            },
            {
                name: "_collateral_precision",
                type: "uint256",
            },
            {
                name: "_A",
                type: "uint256",
            },
            {
                name: "_sqrt_band_ratio",
                type: "uint256",
            },
            {
                name: "_log_A_ratio",
                type: "int256",
            },
            {
                name: "_base_price",
                type: "uint256",
            },
            {
                name: "fee",
                type: "uint256",
            },
            {
                name: "admin_fee",
                type: "uint256",
            },
            {
                name: "_price_oracle_contract",
                type: "address",
            },
        ],
        outputs: [],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "set_admin",
        inputs: [
            {
                name: "_admin",
                type: "address",
            },
        ],
        outputs: [],
    },
    {
        stateMutability: "pure",
        type: "function",
        name: "coins",
        inputs: [
            {
                name: "i",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "address",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "price_oracle",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "dynamic_fee",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_rate_mul",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_base_price",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "p_current_up",
        inputs: [
            {
                name: "n",
                type: "int256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "p_current_down",
        inputs: [
            {
                name: "n",
                type: "int256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "p_oracle_up",
        inputs: [
            {
                name: "n",
                type: "int256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "p_oracle_down",
        inputs: [
            {
                name: "n",
                type: "int256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_p",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "read_user_tick_numbers",
        inputs: [
            {
                name: "user",
                type: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "int256[2]",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "can_skip_bands",
        inputs: [
            {
                name: "n_end",
                type: "int256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "bool",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "active_band_with_skip",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "int256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "has_liquidity",
        inputs: [
            {
                name: "user",
                type: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "bool",
            },
        ],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "deposit_range",
        inputs: [
            {
                name: "user",
                type: "address",
            },
            {
                name: "amount",
                type: "uint256",
            },
            {
                name: "n1",
                type: "int256",
            },
            {
                name: "n2",
                type: "int256",
            },
        ],
        outputs: [],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "withdraw",
        inputs: [
            {
                name: "user",
                type: "address",
            },
            {
                name: "frac",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256[2]",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_dy",
        inputs: [
            {
                name: "i",
                type: "uint256",
            },
            {
                name: "j",
                type: "uint256",
            },
            {
                name: "in_amount",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_dxdy",
        inputs: [
            {
                name: "i",
                type: "uint256",
            },
            {
                name: "j",
                type: "uint256",
            },
            {
                name: "in_amount",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_dx",
        inputs: [
            {
                name: "i",
                type: "uint256",
            },
            {
                name: "j",
                type: "uint256",
            },
            {
                name: "out_amount",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_dydx",
        inputs: [
            {
                name: "i",
                type: "uint256",
            },
            {
                name: "j",
                type: "uint256",
            },
            {
                name: "out_amount",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "exchange",
        inputs: [
            {
                name: "i",
                type: "uint256",
            },
            {
                name: "j",
                type: "uint256",
            },
            {
                name: "in_amount",
                type: "uint256",
            },
            {
                name: "min_amount",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256[2]",
            },
        ],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "exchange",
        inputs: [
            {
                name: "i",
                type: "uint256",
            },
            {
                name: "j",
                type: "uint256",
            },
            {
                name: "in_amount",
                type: "uint256",
            },
            {
                name: "min_amount",
                type: "uint256",
            },
            {
                name: "_for",
                type: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256[2]",
            },
        ],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "exchange_dy",
        inputs: [
            {
                name: "i",
                type: "uint256",
            },
            {
                name: "j",
                type: "uint256",
            },
            {
                name: "out_amount",
                type: "uint256",
            },
            {
                name: "max_amount",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256[2]",
            },
        ],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "exchange_dy",
        inputs: [
            {
                name: "i",
                type: "uint256",
            },
            {
                name: "j",
                type: "uint256",
            },
            {
                name: "out_amount",
                type: "uint256",
            },
            {
                name: "max_amount",
                type: "uint256",
            },
            {
                name: "_for",
                type: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256[2]",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_y_up",
        inputs: [
            {
                name: "user",
                type: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_x_down",
        inputs: [
            {
                name: "user",
                type: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_sum_xy",
        inputs: [
            {
                name: "user",
                type: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256[2]",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_xy",
        inputs: [
            {
                name: "user",
                type: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256[][2]",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "get_amount_for_price",
        inputs: [
            {
                name: "p",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
            {
                name: "",
                type: "bool",
            },
        ],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "set_rate",
        inputs: [
            {
                name: "rate",
                type: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "set_fee",
        inputs: [
            {
                name: "fee",
                type: "uint256",
            },
        ],
        outputs: [],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "set_admin_fee",
        inputs: [
            {
                name: "fee",
                type: "uint256",
            },
        ],
        outputs: [],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "reset_admin_fees",
        inputs: [],
        outputs: [],
    },
    {
        stateMutability: "nonpayable",
        type: "function",
        name: "set_callback",
        inputs: [
            {
                name: "liquidity_mining_callback",
                type: "address",
            },
        ],
        outputs: [],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "admin",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "address",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "A",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "fee",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "admin_fee",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "rate",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "active_band",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "int256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "min_band",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "int256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "max_band",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "int256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "admin_fees_x",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "admin_fees_y",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "price_oracle_contract",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "address",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "bands_x",
        inputs: [
            {
                name: "arg0",
                type: "int256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "bands_y",
        inputs: [
            {
                name: "arg0",
                type: "int256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
    },
    {
        stateMutability: "view",
        type: "function",
        name: "liquidity_mining_callback",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "address",
            },
        ],
    },
];
//# sourceMappingURL=ABI_AMM.js.map