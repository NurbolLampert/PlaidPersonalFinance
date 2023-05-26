import React, { useEffect, useContext, useCallback, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import moment from "moment";

import Header from "./Components/Headers";
import Products from "./Components/ProductTypes/Products";
import Items from "./Components/ProductTypes/Items";
import Context from "./Context";

import styles from "./App.module.scss";

interface Transaction {
  amount: number;
  date: string;
  merchant_name: string;
  category: string[];
  iso_currency_code: string;
}

const App = () => {
  const { linkSuccess, isItemAccess, isPaymentInitiation, dispatch } = useContext(Context);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({income: 0, spend: 0});
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
  
      if (Array.isArray(data.latest_transactions)) {
        setTransactions(data.latest_transactions);
      } else {
        console.error('Error: received data.latest_transactions is not an array', data);
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
      setTransactions([]);
    }
    setIsLoading(false);
  };
  

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
    let income = 0, spend = 0;
    transactions.forEach(transaction => {
      if (transaction.amount > 0) {
        income += transaction.amount;
      } else {
        spend += transaction.amount;
      }
    });
    setTotals({income: parseFloat(income.toFixed(2)), spend: parseFloat(spend.toFixed(2))});
  }, [transactions]);

  const filterTransactionsByDate = (startDate: Date) => {
    return transactions.filter(transaction => new Date(transaction.date) >= startDate);
  };

  const filterTransactionsForLastDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return filterTransactionsByDate(date);
  };

  const handlePeriodClick = (days: number) => {
    setTransactions(filterTransactionsForLastDays(days));
  };


  return (
    <div className={styles.App}>
      <div id="body">
        <Header />
        {linkSuccess && (
          <>
            {isItemAccess && (
              <>
                <h1>Personal Finance Dashboard</h1>
                <button onClick={fetchTransactions}>Get Transactions!</button>
                <div className="period-buttons">
                  <button onClick={() => handlePeriodClick(7)}>Last 7 days</button>
                  <button onClick={() => handlePeriodClick(30)}>Last 30 days</button>
                </div>
                <div className="transactions">
                  {isLoading ? (
                    <p>Loading...</p>
                  ) : (
                    <>
                      <div className="total-info">
                        <p>Total Income: {totals.income}</p>
                        <p>Total Spend: {totals.spend}</p>
                      </div>
                      {transactions.length === 0 ? (
                        <p>No transactions found.</p>
                      ) : (
                        <>
                          <table>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Income</th>
                                <th>Spend</th>
                                <th>Merchant</th>
                                <th>Category</th>
                                <th>Currency</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map(transaction => (
                                <tr key={transaction.date}>
                                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                                  <td>{transaction.amount > 0 ? transaction.amount.toFixed(2) : '-'}</td>
                                  <td>{transaction.amount < 0 ? (-transaction.amount).toFixed(2) : '-'}</td>
                                  <td>{transaction.merchant_name || '-'}</td>
                                  <td>{transaction.category.join(', ')}</td>
                                  <td>{transaction.iso_currency_code}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      )}
                    </>
                  )}
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