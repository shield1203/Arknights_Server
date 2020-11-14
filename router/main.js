const { json } = require('body-parser');

module.exports = function(app){
    var mysql = require('mysql');
    var dbData = require('./dbData');
    var con = mysql.createConnection(dbData);
    var fs =require('fs');
    
    app.get('/', function(req, res, next){
        res.send('ArKnights Server Page');
        console.log('Connect Page');
    });

    // 일반 로그인 아이디 체크
    app.get('/CheckArknightsEmail', function(req, res){
        var email = req.query.email;
        var password = req.query.password;
        var sql = 'SELECT * FROM userdata WHERE user_email=? AND password=?';
        var params = [email, password];
        
        con.query(sql, params, function (error, results, fields) {
            console.log('Request[Check] : ' + email);

            if(results == ''){
                console.log('Result[Check] : fail');
                res.send('check_fail');
            }
            else{     
                var user_id = "";
                user_id += results[0].user_id;
                console.log('Result[Check] : success');
                res.send(user_id);
            }
        });
    });

    // 구글 로그인 아이디체크
    app.get('/CheckGoogleEmail', function(req, res){
        var googleEmail = req.query.googleEmail;
        var sql = 'SELECT * FROM userdata WHERE google_email=?';
        var params = [googleEmail];
        
        con.query(sql, params, function (error, results, fields) {
            console.log('Request[Check] : ' + googleEmail);

            if(results == ''){
                SignUpGoogleEmail(googleEmail);
                
                con.query(sql, params, function (error, results, fields) {        
                    if(results == ''){
                        console.log('Result[Check] : fail');
                        res.send('check_fail');
                    }
                    else{     
                        var user_id = "";
                        user_id += results[0].user_id;
                        console.log('Result[Check] : success');
                        res.send(user_id);
                    }
                });
            }
            else{     
                var user_id = "";
                user_id += results[0].user_id;
                console.log('Result[Check] : success');
                res.send(user_id);
            }
        });
    });

    // 로그인
    app.get('/Login', function(req, res){
        var id = req.query.id;
        var sql = 'SELECT * FROM userdata WHERE user_id=?';
        var params = [id];
        
        con.query(sql, params, function (error, results, fields) {
            console.log('Request[Login] :' + id);

            if(results == ''){
                console.log('Result[Login] : fail');
                res.send('login_fail');
            }
            else{     
                console.log('Result[Login] : success');
                console.log(results);
                res.send(results);
            }
        });
    });

    // 회원가입
    app.get('/SignUp', function(req, res){
        var email = req.query.email;
        var password = req.query.password;
        var sql = 'INSERT INTO userdata (user_email, password) VALUES(?, ?)';
        var params = [email, password];

        con.query(sql, params, function (error, results, fields) {
            console.log('Request[SignUp] : email - ' + email + 'pw -' + password);

            if(error){
                console.log('Result[SignUp] : fail');
                res.send('signUp_fail');
            }
            else{
                console.log('Result[SignUp] : success');
                
                var sql = 'SELECT * FROM userdata WHERE user_email=? AND password=?';
                var params = [email, password];
                
                con.query(sql, params, function (error, results, fields){
                    var user_id = "";
                    user_id += results[0].user_id;
                    res.send(user_id); 
                    console.log(user_id);
                });
            }
        });
    });

    // 구글 회원가입 아이디 확인
    var SignUpGoogleEmail = function(email){
        var sql = 'INSERT INTO userdata (google_email) VALUES(?)';
        var params = [email];

        con.query(sql, params, function (error, results, fields) {
            console.log('Request[SignUp_google] : email -' + email);

            if(error){
                console.log('Result[SignUp_google] : fail');
                console.log(error);
            }
            else{
                console.log('Result[SignUp_google] : success');
            }
        });
    };

    // 유저 아이템리스트 받아오기
    app.get('/Items', function(req, res){
        var id = req.query.id;
        var sql = 'SELECT * FROM useritems WHERE owner_id=?';
        var params = [id];
        
        con.query(sql, params, function (error, results, fields) {
            console.log('Request[item] : ' + id);

            if(results == ''){
                console.log('Result[item] : fail');
                res.send('');
            }
            else{     
                console.log('Result[item] : success');
                res.send(results);
            }
        });
    });

    // 유저 오퍼레이터 리스트 받아오기
    app.get('/Operators', function(req, res){
        var id = req.query.id;
        var sql = 'SELECT * FROM operator WHERE owner_id=?';
        var params = [id];
        
        con.query(sql, params, function (error, results, fields) {
            console.log('Request[operator] : ' + id);

            if(results == ''){
                console.log('Result[operator] : fail');
                res.send('');
            }
            else{     
                console.log('Result[operator] : success');
                res.send(results);
            }
        });
    });

    // 상점 데이터 받아오기
    app.get('/Shop', function(req, res){
        var id = req.query.id;
        var menu = req.query.menu + '.json';
        var path = './shopData/' + menu

        fs.readFile(path, function(err, data){
            if(err){
                res.send('');  
                console.log('Result[Shop] : fail');
                console.log(err);
            } 
            else{   
                // 해당 아이디의 구매목록 불러오기(매진 체크)
                var sql = 'SELECT * FROM purchase WHERE purchase_id=?';
                var params = [id];
                con.query(sql, params, function (error, results, fields) {
                    if(error){
                        res.send('');
                    }else{
                        var dataJSON = JSON.parse(data.toString());

                        for(var index in results){
                            if(menu == 'Shop_Originite_Prime.json' && results[index].shop_menu == 1){
                                dataJSON[results[index].purchase_goods].sold_out = true;
                            }
                            else if(menu == 'Shop_Credit.json' && results[index].shop_menu == 6){
                                dataJSON[results[index].purchase_goods].sold_out = true;
                            }
                        }
                        console.log(dataJSON);
                        res.send(dataJSON);
                    }
                });
                        
                console.log('Result[Shop] : success');
            }
        });
    });

    // 상점 상품 구입
    app.get('/Purchase', function(req, res){
        var id = req.query.id;
        var menu = req.query.menu;
        var number = req.query.number;
        var path;

        console.log('구매');

        if(menu == 1){
            path = './shopData/Shop_Originite_Prime.json';  
        }
        else if(menu == 6){
            path = './shopData/Shop_Credit.json';  
        }

        fs.readFile(path, function(err, data){
            if(err){
                res.send('fail');
                console.log('Result[Purchase] : fail');
                console.log(err);
            } 
            else{   
                var dataJSON = JSON.parse(data.toString());

                var itemCode;
                if(menu == 1){
                    itemCode = 18;
                }else if(menu == 6){
                    itemCode = dataJSON[number].itemCode;
                }
                var amount = dataJSON[number].amount;
                var price = dataJSON[number].price;

                if(PurchaseItem(id, menu, number, price)){
                    UpdateUserItem(id, itemCode, amount);

                    res.send('물자획득');
                    console.log('Result[Purchase] : success');
                }
                else{
                    res.send('fail');
                    console.log('Result[Purchase] : fail');
                }
            }
        });
    });

    // 아이템 구매기록
    var PurchaseItem = function(id, menu, number, price){
        var sql = 'INSERT INTO purchase (purchase_id, shop_menu, purchase_goods) VALUES(?, ?, ?)';
        var params = [id, menu, number];

        con.query(sql, params, function (error, results, fields) {
            console.log('Request[Purchase] : ' + id + ', ' + menu + ', ' + number);

            if(error){
                console.log('Result[Purchase] : fail');
                console.log(error);

                return false;
            }
        });

        if(menu == 6){
            var itemCode = 19;
            UpdateUserItem(id, itemCode, -price);
        }

        return true;
    };

    // 아이템 업데이트 - 수량 변경 또는 생성
    var UpdateUserItem = function(id, item_code, amount){
        var sql = 'SELECT * FROM useritems WHERE owner_id=? AND item_code=?';
        var params = [id, item_code];

        con.query(sql, params, function (error, results, fields) {
            if(error){
                console.log(error);
            }
            else if(results == ''){
                sql = 'INSERT INTO useritems (owner_id, item_code, amount) VALUES(?, ?, ?)';
                params = [id, item_code, amount];

                con.query(sql, params, function (error, results, fields) {
                    console.log('Request[Add_Item] : ' + id + ', ' + item_code + ', ' + amount);
        
                    if(error){
                        console.log('Result[Add_Item] : fail');
                        console.log(error);
                    }
                });
            }
            else{
                amount = amount + results[0].amount;
                sql = 'UPDATE useritems SET amount=? WHERE owner_id=? AND item_code=?';
                params = [amount, id, item_code];

                con.query(sql, params, function (error, results, fields) {
                    console.log('Request[Update_Item] : ' + id + ', ' + item_code + ', ' + amount);
        
                    if(error){
                        console.log('Result[Update_Item] : fail');
                        console.log(error);
                    }
                });
            }
        });      
    };

    // 팀 조회
    app.get('/Teams', function(req, res){
        var id = req.query.id;
        var sql = 'SELECT teams FROM userdata WHERE user_id=?';
        var params = [id];

        con.query(sql, params, function (error, results, fields) {
            console.log('Request[Teams] : ' + id);
            console.log(results[0]);

            if(results[0].teams == null){
                var path = './TeamData/Empty_Team.json';
                fs.readFile(path, function(err, data){
                    if(err){
                        res.send('');
                        console.log(err);
                    } 
                    else{   
                        res.send(data.toString());
                        //console.log(data.toString());
                    }
                });
            }
            else{
                res.send(results[0].teams);
            }
        });
    });

    // 팀 편성
    app.post('/TeamsChange', function(req, res){
        var id = req.query.id;
        var teams = JSON.stringify(req.body)

        console.log('Request[TeamChange] : ' + teams);

        var sql = 'UPDATE userdata SET teams=? WHERE user_id=?';
        var params = [teams, id];

        con.query(sql, params, function (error, results, fields) {
            if(error){
                console.log(error);
            }
        });
    });
}