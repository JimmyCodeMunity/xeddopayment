const express = require("express");
const app = express();
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT;
const tokenUrl = process.env.tokenUrl;

const clientId = process.env.clientId;
const clientSecret = process.env.clientSecret;

const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/", (req, res) => {
  res.send("Welcome to my payment gateway");
});

const getToken = async () => {
  try {
    const requestOptions = {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    };

    const response = await axios.get(tokenUrl, requestOptions);
    console.log("Token obtained:", response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching token:", error);
    throw error;
  }
};

app.post("/confirmurl", async (req, res) => {
  const { MerchantCode, ConfirmationUrl } = req.body;
  try {
    const token = await getToken();
    const response = await axios.post(
      "https://sandbox.sasapay.app/api/v1/payments/register-ipn-url/",
      {
        MerchantCode,
        ConfirmationUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.response.data);
  }
});

app.post('/c2b-callback-results', (req, res) => {
    const callbackData = req.body;
    console.log('C2B Callback Data:', callbackData);
    console.log("result code",callbackData.ResultCode)
    console.log("description of transaction",callbackData.ResultDesc)
    res.status(200).send('Callback received');
});

app.post("/request-payment", async (req, res) => {
  // getToken();
  try {
    const token = await getToken();
    const {
      MerchantCode,
      NetworkCode,
      PhoneNumber,
      TransactionDesc,
      AccountReference,
      Currency,
      Amount,
      CallBackURL
    } = req.body;

    console.log("Request body:", req.body);
    const response = await axios.post(
      "https://sandbox.sasapay.app/api/v1/payments/request-payment/",
      {
        MerchantCode,
        NetworkCode,
        PhoneNumber,
        TransactionDesc,
        AccountReference,
        Currency,
        Amount,
        CallBackURL,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
    console.log(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error.response.data);
  }
});
