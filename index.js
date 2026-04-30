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

// 🔥 متغير عالمي للسعر
let currentPrice = "0.00";

// ✅ تحديث السعر كل ثانية
async function updateEthPrice() {
  try {
    const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT");
    currentPrice = res.data.price;
  } catch (e) {
    console.log("ETH API Error");
  }
}

// تحديث السعر كل ثانية
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

  // 🔥 عند انتهاء الجولة
  if (countdown <= 0) {

    // استخراج آخر رقم من السعر
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

  // 🔥 إرسال التحديث كل ثانية (السعر مضاف هنا)
  io.emit("update", {
    countdown,
    userCount,
    red,
    green,
    purple,
    price: currentPrice // 🔥 مهم جداً
  });

}, 1000);

app.get("/", (req, res) => {
  res.send("Server Working 🚀");
});

server.listen(3000, () => {
  console.log("Server running...");
});