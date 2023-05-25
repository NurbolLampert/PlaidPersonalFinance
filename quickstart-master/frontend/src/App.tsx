import React, { useEffect, useContext, useCallback, useState } from "react";
import { Line } from 'react-chartjs-2';
import moment from 'moment';


import Header from "./Components/Headers";
import Products from "./Components/ProductTypes/Products";
import Items from "./Components/ProductTypes/Items";
import Context from "./Context";

import styles from "./App.module.scss";

interface Transaction {
  transaction_id: string;
  date: string;
  category: string[];
  amount: number;
}

const App = () => {
  const { linkSuccess, isItemAccess, isPaymentInitiation, dispatch } = useContext(Context);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const simpleTransactionCall = useCallback(async () => {
    const response = await fetch("api/transactions",{
      method: "GET",
    });
    const data = await response.json();
    setTransactions(data.latest_transactions);
  }, []);

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

  const chartData = {
    labels: transactions.map((transaction) => new Date(transaction.date)),
    datasets: [
      {
        label: 'Spending',
        data: transactions.map((transaction) => transaction.amount),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className={styles.App}>
      <div className={styles.container}>
        <Header />
        {linkSuccess && (
          <>
            {isPaymentInitiation && (
              <Products />
            )}
            {isItemAccess && (
              <>
                <Products />
                <Items />
                <button onClick={simpleTransactionCall}>Get transactions!</button>

                {/* Add the table */}
                <div>
                  <h1>Transactions</h1>

                  {transactions.map(transaction => {
                    const date = transaction?.date;
                    const formattedDate = moment(date).format('YYYY-MM-DD');

                    const amount = Number(transaction?.amount);

                    const transactionId = transaction?.transaction_id;
                    const category = transaction?.category;

                    return (
                      <div key={transactionId}>
                        <p>Date: {formattedDate}</p>
                        <p>Amount: {amount}</p>
                        <p>Category: {category}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Add the chart */}
                <Line data={chartData} options={{scales: { x: { type: 'timeseries' }}}} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default App;
