import CoinbaseCommerce from 'coinbase-commerce-node';

const apiKey = process.env.COINBASE_COMMERCE_API_KEY;

let resources: any = null;

if (apiKey) {
  CoinbaseCommerce.Client.init(apiKey);
  resources = CoinbaseCommerce.resources;
}

export { resources };
