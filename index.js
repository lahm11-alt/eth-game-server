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

// 🚫 متغيرات منع التكرار
let resultSent = false; // هل تم إرسال النتيجة بالفعل؟
let roundNumber = 0; // رقم الجولة الحالي
let lastResultTime = 0; // وقت آخر نتيجة

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

  // 🔥 نهاية الجولة - نرسل النتيجة مرة واحدة فقط
  if (countdown <= 0 && !resultSent) {
    
    // تأكيد أن النتيجة لم ترسل من قبل
    resultSent = true;
    roundNumber++;
    
    let lastDigit = currentPrice.toString().slice(-1);
    let resultTime = Date.now();
    lastResultTime = resultTime;

    lastNumbers.unshift(lastDigit);
    if (lastNumbers.length > 20) lastNumbers.pop();

    console.log(`🏆 ROUND #${roundNumber} ENDED | Winning Number: ${lastDigit} | Price: ${currentPrice} | Time: ${new Date(resultTime).toISOString()}`);
    console.log(`📊 History: [${lastNumbers.join(', ')}]`);

    // إرسال النتيجة مرة واحدة فقط
    io.emit("result", {
      digit: lastDigit,
      price: currentPrice,
      history: lastNumbers,
      roundNumber: roundNumber,
      timestamp: resultTime
    });

    // إعادة تعيين بعد إرسال النتيجة مباشرة
    countdown = 60;
    isFrozen = false;
    userCount = 0;
    red = 0;
    green = 0;
    purple = 0;

    // إعادة تعيين متغير منع التكرار بعد ثانية واحدة (حماية إضافية)
    setTimeout(() => {
      resultSent = false;
      console.log(`🔄 Ready for next round. Current round: #${roundNumber}`);
    }, 1000);

  }

  // 🔥 تحديث مباشر كل ثانية
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
// 🛡️ حماية إضافية: إذا تعطلت إعادة التعيين
// =========================
setInterval(() => {
  // إذا مرت 5 ثواني على آخر نتيجة ولم يتم إعادة تعيين resultSent
  const timeSinceLastResult = Date.now() - lastResultTime;
  if (resultSent && timeSinceLastResult > 5000) {
    console.warn(`⚠️ Force resetting resultSent after ${timeSinceLastResult}ms`);
    resultSent = false;
    countdown = 60;
    isFrozen = false;
    userCount = 0;
    red = 0;
    green = 0;
    purple = 0;
  }
}, 2000);

// =========================

app.get("/", (req, res) => {
  res.send("Server Working 🚀");
});

// 📊 نقطة نهاية لعرض حالة السيرفر
app.get("/status", (req, res) => {
  res.json({
    countdown: countdown,
    isFrozen: isFrozen,
    userCount: userCount,
    bets: { red, green, purple },
    price: currentPrice,
    roundNumber: roundNumber,
    lastResultSent: new Date(lastResultTime).toISOString(),
    resultSent: resultSent,
    history: lastNumbers
  });
});

server.listen(3000, () => {
  console.log("🎮 Server running on port 3000");
  console.log("📊 Status endpoint: http://localhost:3000/status");
  console.log("🛡️ Anti-duplicate protection: ENABLED");
});