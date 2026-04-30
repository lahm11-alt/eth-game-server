const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let countdown = 60;
let isFrozen = false;

let userCount = 0;
let red = 0, green = 0, purple = 0;

let lastNumbers = [];

async function getEthLastDigit() {
  try {
    const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT");
    const price = res.data.price; // مثال: 2346.79
    const lastDigit = price[price.length - 1]; // 9
    return { price, digit: lastDigit };
  } catch (e) {
    return { price: "0.00", digit: "0" };
  }
}

setInterval(async () => {

  countdown--;

  // 🔥 عند 20 وقف التحديث
  if (countdown === 20) {
    isFrozen = true;
  }

  // تحديث فقط إذا ليس متوقف
  if (!isFrozen) {
    userCount += Math.floor(Math.random() * 100) + 50;

    red += Math.floor(Math.random() * 500);
    green += Math.floor(Math.random() * 500);
    purple += Math.floor(Math.random() * 500);
  }

  // نهاية الجولة
  if (countdown <= 0) {

    const eth = await getEthLastDigit();

    lastNumbers.unshift(eth.digit);
    if (lastNumbers.length > 20) lastNumbers.pop();

    io.emit("result", {
      digit: eth.digit,
      price: eth.price,
      history: lastNumbers
    });

    // reset
    countdown = 60;
    isFrozen = false;
    userCount = 0;
    red = 0;
    green = 0;
    purple = 0;
  }

  // إرسال البيانات
  io.emit("update", {
    countdown,
    userCount,
    red,
    green,
    purple
  });

}, 1000);

io.on("connection", (socket) => {
  console.log("User connected");
});

app.get("/", (req, res) => {
  res.send("ETH Game Server Running 🚀");
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});