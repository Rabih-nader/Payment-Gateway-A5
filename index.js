const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");
const mongoose = require("mongoose");

// Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://user1:YXXaYe3CT0gjgnT3@Cluster0.mongodb.net/PaymentGateway",
 { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas", err));

// Set up PayPal SDK
const clientId = "ARz80gImPMDA027PPR2GHZ7XNJ5IeohzxFrpIC4WKNuYps6e38dNMzDh67XPM5irpHh_xUzWx9CLSGvG"; // Replace with your PayPal client ID
const clientSecret = "ELDRSufFdfymW1nCboIgY1QKX4duBtguT8Mnb17JJk7gu669lmg5qQPUe5oxXBj33sKBgtzkoTKLL6lr"; // Replace with your PayPal client secret
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

const PORT = process.env.PORT || 3000;

const app = express();

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

app.post("/pay", async (req, res) => {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: "2.00",
        },
      },
    ],
  });

  try {
    const order = await paypalClient.execute(request);
    const approvalUrl = order.result.links.find(link => link.rel === 'approve').href;
    res.redirect(approvalUrl);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).send("Failed to create order");
  }
});

app.get("/success", async (req, res) => {
  const orderId = req.query.orderId;
  const request = new paypal.orders.OrdersGetRequest(orderId);

  try {
    const order = await paypalClient.execute(request);
    const captureId = order.result.purchase_units[0].payments.captures[0].id;

    // Capture the payment
    const captureRequest = new paypal.payments.CapturesCaptureRequest(captureId);
    captureRequest.requestBody({});

    const capture = await paypalClient.execute(captureRequest);
    console.log("Capture details:", capture.result);
    res.send("Payment captured successfully");
  } catch (error) {
    console.error("Failed to capture payment:", error);
    res.status(500).send("Failed to capture payment");
  }
});

app.get("/cancel", (req, res) => res.send("Payment cancelled"));

app.listen(PORT, () => console.log(`Server Started on ${PORT}`));
