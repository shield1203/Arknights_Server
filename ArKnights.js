var express = require('express')
var app = express();

app.use(express.json())

var router = require('./router/main')(app);

var server = app.listen(3000, function(){
    console.log('Server start : project ArKnight');
})