const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 🎮 بيانات اللعبة
let countdown = 60;
let isFrozen = false;

let userCount = 0;
let red = 0, green = 0, purple = 0;

let lastNumbers = [];

// 💰 السعر
let currentPrice = "0.00";
let lastRealPrice = 0;

// =========================
// 🔥 جلب السعر الحقيقي كل 5 ثواني
// =========================
async function fetchRealPrice() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );

    lastRealPrice = res.data.ethereum.usd;

    console.log("REAL PRICE:", lastRealPrice);

  } catch (e) {
    console.log("API ERROR:", e.message);
  }
}

setInterval(fetchRealPrice, 5000);
fetchRealPrice();

// =========================
// 🔥 تحريك السعر كل ثانية (وهمي)
// =========================
setInterval(() => {

  if (lastRealPrice > 0) {

    let move = (Math.random() * 4 - 2); // حركة +/- 2 دولار

    let newPrice = lastRealPrice + move;

    currentPrice = newPrice.toFixed(2);
  }

}, 1000);

// =========================
// 🎮 منطق اللعبة
// =========================
setInterval(() => {

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

  // 🔥 نهاية الجولة
  if (countdown <= 0) {

    let lastDigit = currentPrice.toString().slice(-1);

    lastNumbers.unshift(lastDigit);
    if (lastNumbers.length > 20) lastNumbers.pop();

    io.emit("result", {
      digit: lastDigit,
      price: currentPrice,
      history: lastNumbers
    });

    // إعادة تعيين
    countdown = 60;
    isFrozen = false;
    userCount = 0;
    red = 0;
    green = 0;
    purple = 0;
  }

  // 🔥 تحديث مباشر
  io.emit("update", {
    countdown,
    userCount,
    red,
    green,
    purple,
    price: currentPrice
  });

}, 1000);

// =========================

app.get("/", (req, res) => {
  res.send("Server Working 🚀");
});

server.listen(3000, () => {
  console.log("Server running...");
});