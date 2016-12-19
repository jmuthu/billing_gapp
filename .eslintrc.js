module.exports = {
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "env": {
        "browser": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-unused-vars": 0,
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    },
    "globals": {
        "SpreadsheetApp": true,
        "require": false,
        "BalanceRepository": true,
        "SpreadsheetRepository": true,
        "Subscriber": true,
        "Balance": true,
        "BalanceRepositorySpreadsheet": true
    }
};
