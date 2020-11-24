var express = require('express')
var app = express();

app.use(express.json())
require('dotenv').config();

var router = require('./router/main')(app);

var server = app.listen(process.env.PORT, function(){
    console.log('Server start : project ArKnight');
})