import CoinbaseCommerce from 'coinbase-commerce-node';

const apiKey = process.env.COINBASE_COMMERCE_API_KEY;

if (!apiKey) {
  throw new Error('COINBASE_COMMERCE_API_KEY is not set');
}

CoinbaseCommerce.Client.init(apiKey);

export const { resources } = CoinbaseCommerce;
