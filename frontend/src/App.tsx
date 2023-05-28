import React, { useEffect, useContext, useCallback, useState } from "react";

import Header from "./Components/Headers";
import Products from "./Components/ProductTypes/Products";
import Items from "./Components/ProductTypes/Items";
import Context from "./Context";
import { Transaction } from './Transaction';
import Charts from './Charts';

import styles from "./App.module.scss";


const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sortedTransactions, setSortedTransactions] = useState<Transaction[]>([]);
  const { linkSuccess, isItemAccess, isPaymentInitiation, dispatch } = useContext(Context);

  const getInfo = useCallback(async () => {
    const response = await fetch("/api/info", { method: "POST" });
    if (!response.ok) {
      dispatch({ type: "SET_STATE", state: { backend: false } });
      return { paymentInitiation: false };
    }
    const data = await response.json();
    const paymentInitiation: boolean = data.products.includes(
      "payment_initiation"
    );
    dispatch({
      type: "SET_STATE",
      state: {
        products: data.products,
        isPaymentInitiation: paymentInitiation,
      },
    });
    return { paymentInitiation };
  }, [dispatch]);

  const generateToken = useCallback(
    async (isPaymentInitiation) => {
      // Link tokens for 'payment_initiation' use a different creation flow in your backend.
      const path = isPaymentInitiation
        ? "/api/create_link_token_for_payment"
        : "/api/create_link_token";
      const response = await fetch(path, {
        method: "POST",
      });
      if (!response.ok) {
        dispatch({ type: "SET_STATE", state: { linkToken: null } });
        return;
      }
      const data = await response.json();
      if (data) {
        if (data.error != null) {
          dispatch({
            type: "SET_STATE",
            state: {
              linkToken: null,
              linkTokenError: data.error,
            },
          });
          return;
        }
        dispatch({ type: "SET_STATE", state: { linkToken: data.link_token } });
      }
      // Save the link_token to be used later in the Oauth flow.
      localStorage.setItem("link_token", data.link_token);
    },
    [dispatch]
  );

  useEffect(() => {
    const init = async () => {
      const { paymentInitiation } = await getInfo(); // used to determine which path to take when generating token
      // do not generate a new token for OAuth redirect; instead
      // setLinkToken from localStorage
      if (window.location.href.includes("?oauth_state_id=")) {
        dispatch({
          type: "SET_STATE",
          state: {
            linkToken: localStorage.getItem("link_token"),
          },
        });
        return;
      }
      generateToken(paymentInitiation);
    };
    init();
  }, [dispatch, generateToken, getInfo]);

  useEffect(() => {
    // Fetch transactions
    const fetchTransactions = async () => {
      const response = await fetch("api/transactions", { method: "GET" });
      const data = await response.json();
      setTransactions(data.latest_transactions);
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    setSortedTransactions(transactions);
  }, [transactions]);

  const sortTransactions = (type: 'date' | 'spent' | 'gained') => {
    let sorted = [...transactions];
    switch(type) {
      case 'date':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'spent':
        sorted = transactions.filter(t => t.amount > 0);
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case 'gained':
        sorted = transactions.filter(t => t.amount < 0);
        sorted.sort((a, b) => a.amount - b.amount);
        break;
    }
    setSortedTransactions(sorted);
  };

  // const totalSpent = transactions.reduce((total, transaction) => {
  //   return total + (transaction.amount > 0 ? transaction.amount : 0);
  // }, 0);


  return (
    <div className={styles.App}>
      <div className={styles.container}>
        <Header />
        {linkSuccess && (
          <>
            {isItemAccess && (
              <>
                <Charts transactions={transactions} />
                <div>
                <button onClick={() => sortTransactions('date')}>Sort by Date</button>
                <button onClick={() => sortTransactions('spent')}>Sort by Spent</button>
                <button onClick={() => sortTransactions('gained')}>Sort by Gained</button>
                {/* <div>Total Spend: USD {totalSpent.toFixed(2)}</div> */}
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Spent</th>
                      <th>Gained</th>
                      <th>Merchant</th>
                      <th>Category</th>
                      <th>Currency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.map((transaction) => (
                      <tr key={transaction.date + transaction.amount}>
                        <td>{transaction.date}</td>
                        <td>{transaction.amount > 0 ? transaction.amount.toFixed(2) : '-'}</td>
                        <td>{transaction.amount < 0 ? (-transaction.amount).toFixed(2) : '-'}</td>
                        <td>{transaction.merchant_name || '-'}</td>
                        <td>{transaction.category.join(', ')}</td>
                        <td>{transaction.iso_currency_code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
