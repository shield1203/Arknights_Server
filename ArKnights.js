const express = require('express')
const app = express();

app.use(express.json())
require('dotenv').config();

const router = require('./router/main')(app);

const server = app.listen(process.env.PORT, function(){
    console.log('Server start : project ArKnight');
})