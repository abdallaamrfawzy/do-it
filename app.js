require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@socialweb.u6ulaex.mongodb.net/?retryWrites=true&w=majority&appName=SocialWeb`
const userRoute = require("./routes/users.js");

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors({ origin: "*" }));
app.use("/api/users", userRoute);

// connect to database 
mongoose.connect(url).then(() => {
    console.log("mongodb connect success")
})

app.listen(port, () => {
    console.log(`Server start on port ${port} `);
});