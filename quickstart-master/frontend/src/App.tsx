import React, { useEffect, useContext, useCallback } from "react";

import Header from "./Components/Headers";
import Products from "./Components/ProductTypes/Products";
import Items from "./Components/ProductTypes/Items";
import Context from "./Context";

import styles from "./App.module.scss";

const App = () => {
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
                <button onClick={simpleTransactionCall}>
                  Get Transactions!
                </button>
                <div id="totalSpend"></div>
                <table id="transactionTable">
                    <thead>
                        <tr>
                            <th>
                                <button id="dateFilter">Date</button>
                            </th>
                            <th>
                                <button id="amountFilter">Amount</button>
                            </th>
                            <th>Merchant</th>
                            <th>Category</th>
                            <th>Currency</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody">
                    </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

let transactions: any[] = [];

const simpleTransactionCall = async () => {
    const response = await fetch("api/transactions", {
        method: "GET",
    });
    const data = await response.json();
    transactions = data.latest_transactions;
    displayTransactions(transactions);
};

const displayTransactions = (transactions: any[]) => {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) {
        console.error('Could not find table body element');
        return;
    }
    tableBody.innerHTML = '';

    transactions.forEach((transaction) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.amount}</td>
            <td>${transaction.merchant_name || '-'}</td>
            <td>${transaction.category.join(', ')}</td>
            <td>${transaction.iso_currency_code}</td>
        `;
        tableBody.appendChild(row);
    });

    const totalSpendElement = document.getElementById('totalSpend');
    if (totalSpendElement) {
        const totalSpend = transactions.reduce((total, transaction) => {
            return total + (transaction.amount > 0 ? transaction.amount : 0);
        }, 0);
        totalSpendElement.textContent = `Total Spent Last Week: USD ${totalSpend.toFixed(2)}`;
    }
};

document.getElementById('dateFilter')?.addEventListener('click', () => {
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  displayTransactions(transactions);
});

document.getElementById('amountFilter')?.addEventListener('click', () => {
  transactions.sort((a, b) => b.amount - a.amount);
  displayTransactions(transactions);
});




export default App;