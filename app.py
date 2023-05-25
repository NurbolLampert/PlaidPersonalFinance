from flask import Flask, render_template, request, jsonify
from plaid.api import plaid_api
from plaid import Configuration, ApiClient, Environment
from datetime import datetime, timedelta

app = Flask(__name__)

PLAID_CLIENT_ID = '63b8f9256c19fe00130f7d05'
PLAID_SECRET = '887420aa55fe4761d207c314ad10b4'
configuration = Configuration(
    host=Environment.Sandbox,
    api_key={
        'clientId': PLAID_CLIENT_ID,
        'secret': PLAID_SECRET,
        'plaidVersion': '2020-09-14'
    }
)
api_client = ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_access_token', methods=['POST'])
def get_access_token():
    public_token = request.form['public_token']
    exchange_response = client.item_public_token_exchange(public_token_create_request=public_token)
    access_token = exchange_response['access_token']
    return jsonify({'access_token': access_token})

@app.route('/transactions', methods=['GET'])
def transactions():
    # Replace 'access_token' with the actual access token
    access_token = 'access_token'

    # Pull transactions for the last 30 days
    start_date = '{:%Y-%m-%d}'.format(datetime.now() + timedelta(-30))
    end_date = '{:%Y-%m-%d}'.format(datetime.now())
    response = client.transactions_get(access_token, start_date, end_date)
    transactions = response['transactions']

    # Manipulate the count and offset parameters to paginate transactions and retrieve all available data
    while len(transactions) < response['total_transactions']:
        response = client.transactions_get(access_token, start_date, end_date,
                                                  offset=len(transactions))
        transactions.extend(response['transactions'])

    return jsonify({'transactions': transactions})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
