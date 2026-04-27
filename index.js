const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let countdown = 60;
let users = 0;

let red = 0;
let green = 0;
let purple = 0;

let history = [];

async function getETHPrice() {
    try {
        const res = await axios.get("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT");
        return parseFloat(res.data.price);
    } catch {
        return 2000 + Math.random() * 1000;
    }
}

function gameLoop() {
    setInterval(async () => {

        if (countdown > 0) {
            countdown--;

            users += Math.floor(Math.random() * 50);

            red += Math.random() * 500;
            green += Math.random() * 500;
            purple += Math.random() * 500;

            io.emit("update", {
                countdown,
                users,
                red,
                green,
                purple
            });

        } else {
            let price = await getETHPrice();
            let lastDigit = Math.floor(price * 100) % 10;

            history.unshift(lastDigit);
            if (history.length > 20) history.pop();

            io.emit("result", {
                number: lastDigit,
                history
            });

            countdown = 60;
            users = 1000 + Math.random() * 5000;
            red = 0;
            green = 0;
            purple = 0;
        }

    }, 1000);
}

io.on("connection", (socket) => {
    console.log("User connected");
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});

gameLoop();