export interface Transaction {
    date: string;
    amount: number;
    merchant_name: string;
    category: string[];
    iso_currency_code: string;
  }