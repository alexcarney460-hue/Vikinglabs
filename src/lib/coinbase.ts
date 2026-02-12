import CoinbaseCommerce from 'coinbase-commerce-node';

const apiKey = process.env.COINBASE_COMMERCE_API_KEY;

if (apiKey) {
  CoinbaseCommerce.Client.init(apiKey);
  export const { resources } = CoinbaseCommerce;
} else {
  // If not configured, export null so routes can handle missing config at runtime
  // @ts-ignore
  export const resources = null;
}
