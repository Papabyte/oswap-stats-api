## Oswap-stats-api

This O<sub>byte</sub> light node explores the DAG and provides API endpoints giving information about trades happening on Oswap.


#### Installation

Install node.js 8+, clone the repository, then

`npm install`

By default the API is accessible at `http://localhost:4100` (`http://localhost:4101` for testnet). You may want to setup a reverse proxy like Nginx to make it accessible on a public url.

#### Run

`node start`


#### Endpoints


- */api/v1/assets*

Return all assets having trades listed. To be noted that only assets having a symbol registered on [Obyte decentralized registry](https://github.com/byteball/token-registry-ui) will appear.

```json
{
  "GBYTE": {
    "asset_id": "base",
    "decimals": 9,
    "description": "Obyte DAG native currency",
    "symbol": "GBYTE",
    "unified_cryptoasset_id": 1492,
    "name": "Obyte"
  },
  "LAMBO": {
    "asset_id": "J98n2rfwcEqxSXPmoyrAezPc1Q4X6CzeZdygAe2IZaA=",
    "decimals": 9,
    "description": "This is just a test token.",
    "symbol": "LAMBO"
  }
}
```



- */api/v1/summary*

Return an array of all traded pairs with their characteristics and statistics for last 24 hours

```json
[{
  "market_name": "LAMBO-GBYTE",
  "quote_symbol": "GBYTE",
  "base_symbol": "LAMBO",
  "quote_id": "base",
  "base_id": "J98n2rfwcEqxSXPmoyrAezPc1Q4X6CzeZdygAe2IZaA=",
  "lowest_price_24h": 3.2046504862368113,
  "highest_price_24h": 3.2046504862368113,
  "last_price": 3.2046504862368113,
  "quote_volume": 0.1,
  "base_volume": 0.031204651
}]
```



- */api/v1/tickers*

Return an associative array  of all tickers sorted by markets

```json
{
  "LAMBO-GBYTE": {
    "market_name": "LAMBO-GBYTE",
    "quote_symbol": "GBYTE",
    "base_symbol": "LAMBO",
    "quote_id": "base",
    "base_id": "J98n2rfwcEqxSXPmoyrAezPc1Q4X6CzeZdygAe2IZaA=",
    "lowest_price_24h": 3.2046504862368113,
    "highest_price_24h": 3.2046504862368113,
    "last_price": 3.2046504862368113,
    "quote_volume": 0.1,
    "base_volume": 0.031204651
  }
}
```



- */api/v1/ticker/<market_name>*

Return a ticker for a specific market



- */api/v1/trades/<market_name>*

Return an array of last 24h trades for a specific market

```json
[{
  "market_pair": "LAMBO-GBYTE",
  "price": 3.2046504862368113,
  "base_volume": 0.031204651,
  "quote_volume": 0.1,
  "time": "2020-09-17T05:57:30.000Z",
  "timestamp": 1600322250000,
  "trade_id": "5mcKjYbgXchjgSLNYSTsy5kIacA6G/FJV70VoTupBYg=_0",
  "type": "buy",
  "explorer": "https://explorer.obyte.org/#5mcKjYbgXchjgSLNYSTsy5kIacA6G/FJV70VoTupBYg="
}]
```
