const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let countdown = 60;
let isFrozen = false;

let userCount = 0;
let red = 0, green = 0, purple = 0;

let lastNumbers = [];

// 🔥 السعر
let currentPrice = "0.00";

// ✅ جلب السعر (مع طباعة للتأكد)
async function updateEthPrice() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { timeout: 3000 }
    );

    if (res.data && res.data.ethereum) {
      currentPrice = res.data.ethereum.usd.toString();

      console.log("ETH PRICE:", currentPrice);
    }

  } catch (e) {
    console.log("COINGECKO ERROR:", e.message);
  }
}

// 🔥 مهم جداً (تشغيل فوري)
updateEthPrice();

// 🔥 تحديث مستمر
setInterval(updateEthPrice, 1000);


// 🎮 اللعبة
setInterval(async () => {

  countdown--;

  if (countdown === 20) {
    isFrozen = true;
  }

  if (!isFrozen) {
    userCount += Math.floor(Math.random() * 100) + 50;

    red += Math.floor(Math.random() * 500);
    green += Math.floor(Math.random() * 500);
    purple += Math.floor(Math.random() * 500);
  }

  if (countdown <= 0) {

    let lastDigit = currentPrice.toString().slice(-1);

    lastNumbers.unshift(lastDigit);
    if (lastNumbers.length > 20) lastNumbers.pop();

    io.emit("result", {
      digit: lastDigit,
      price: currentPrice,
      history: lastNumbers
    });

    countdown = 60;
    isFrozen = false;
    userCount = 0;
    red = 0;
    green = 0;
    purple = 0;
  }

  // 🔥 إرسال السعر
  io.emit("update", {
    countdown,
    userCount,
    red,
    green,
    purple,
    price: currentPrice
  });

}, 1000);

app.get("/", (req, res) => {
  res.send("Server Working 🚀");
});

server.listen(3000, () => {
  console.log("Server running...");
});