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

---------------------------------------

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

---------------------------------------

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
---------------------------------------

- */api/v1/ticker/<market_name>*

Return a ticker for a specific market

---------------------------------------

- */api/v1/trades/<market_name>*

Return an array of last 24h trades for a specific market

```json
[{
  "market_name": "LAMBO-GBYTE",
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

---------------------------------------


- */api/v1/candles/\<market_name\>?period=\<period\>&start=\<start\>&end=\<end\>*

Return an array of candlesticks for a time windows.

- **period**: `hourly` or `daily`
- **start**: unix timestamp (`1601013600`), ISO8601 date (`2020-09-25`) or ISO8601 datetime (`2020-09-25T06:00:00.000Z`)
- **end**: unix timestamp (`1601013600`), ISO8601 date (`2020-09-25`) or ISO8601 datetime (`2020-09-25T06:00:00.000Z`)


```json
[{
    "quote_volume": 0.3483240085253005,
    "base_volume": 0.014380741,
    "highest_price": 24.221561915710776,
    "lowest_price": 24.221561915710776,
    "open_price": 24.221561915710776,
    "close_price": 24.221561915710776,
    "start_timestamp": "2020-09-28T00:00:00.000Z"
}, {
    "quote_volume": 0,
    "base_volume": 0,
    "highest_price": 24.221561915710776,
    "lowest_price": 24.221561915710776,
    "open_price": 24.221561915710776,
    "close_price": 24.221561915710776,
    "start_timestamp": "2020-09-29T00:00:00.000Z"
}, {
    "quote_volume": 0.035434728,
    "base_volume": 0.0011,
    "highest_price": 32.215553,
    "lowest_price": 32.19175,
    "open_price": 32.215553,
    "close_price": 32.19175,
    "start_timestamp": "2020-09-30T00:00:00.000Z"
}]
```