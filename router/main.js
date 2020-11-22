const { json } = require('body-parser');

module.exports = function(app){
    var mysql = require('mysql');
    var dbData = require('./dbData');
    var con = mysql.createConnection(dbData);
    var fs = require('fs');
    
    app.get('/', function(req, res, next){
        res.send('ArKnights Server Page');
        console.log('Connect Page');
    });

//// Router module //////////////////////////////////

    // 일반 로그인 아이디 체크
    var ArknightsLogin = function(req, res){
        var sql = 'SELECT * FROM userdata WHERE user_email=? AND password=?';
        var params = [req.query.email, req.query.password];
        
        console.log('Request[Check] : ' + req.query.email);
        CheckArknightsLoginData(res, sql, params);
    }

    // 구글 로그인 아이디체크
    var GoogleLogin = function(req, res){
        var sql = 'SELECT * FROM userdata WHERE google_email=?';
        var params = [req.query.googleEmail];
        
        console.log('Request[Check] : ' + req.query.googleEmail);
        CheckGoogleLoginData(res, req.query.googleEmail, sql, params);
    }
    
    // 로그인
    var Login = function(req, res){
        var sql = 'SELECT * FROM userdata WHERE user_id=?';
        var params = [req.query.id];
        
        console.log('Request[Login] :' + req.query.id);
        LoginResult(res, sql, params);
    }

    // 회원가입
    var SignUp = function(req, res){
        var sql = 'INSERT INTO userdata (user_email, password) VALUES(?, ?)';
        var params = [req.query.email, req.query.password];

        console.log('Request[SignUp] : email - ' + req.query.email + 'pw -' + req.query.password);
        SignUpArknights(req, res, sql, params);
    }

    // 유저 아이템리스트 받아오기
    var Items = function(req, res){
        var id = req.query.id;
        var sql = 'SELECT * FROM useritems WHERE owner_id=?';
        var params = [id];
        
        console.log('Request[item] : ' + id);
        SendUserItems(res, sql, params);
    }

    // 유저 오퍼레이터 리스트 받아오기
    var Operators = function(req, res){
        var sql = 'SELECT * FROM operator WHERE owner_id=?';
        var params = [req.query.id];
        
        console.log('Request[operator] : ' + req.query.id);
        SendUserOperators(res, sql, params);
    }

    // 상점 데이터 받아오기
    var Shop = function(req, res){
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
                var params = [req.query.id];
                
                SendShopGoods(res, data, menu, sql, params);
            }
        });
    }

    // 상점 상품 구입
    var Purchase = function(req, res){
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
    }

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
    var Teams = function(req, res){
        var sql = 'SELECT teams FROM userdata WHERE user_id=?';
        var params = [req.query.id];

        console.log('Request[Teams] : ' + req.query.id);
        SendUserTeams(res, sql, params);
    }

    // 팀 편성
    var TeamsChange = function(req, res){
        var teams = JSON.stringify(req.body)

        console.log('Request[TeamChange] : ' + teams);

        var sql = 'UPDATE userdata SET teams=? WHERE user_id=?';
        var params = [teams, req.query.id];

        con.query(sql, params, function (error, results, fields) {
            if(error){
                console.log(error);
            }
        });
    }

    // 클리어 작전 조회
    var Operations = function(req, res){
        var sql = 'SELECT episode, chapter, clear_rank FROM operation WHERE clear_user_id=?';
        var params = [req.query.id];

        console.log('Request[Operations] : ' + req.query.id);
        SendUserOperations(res, sql, params);
    }

    // 작전 클리어
    var OperationClear = function(req, res){
        var sql = 'SELECT * FROM operation WHERE clear_user_id=? AND episode=? AND chapter=?';
        var params = [req.query.id, req.query.episode, req.query.chapter];

        console.log('Request[OperationClear] : ' + req.query.id);
        con.query(sql, params, function (error, results, fields) {
            if(results = ''){
                InputOperationData(req.query.id, req.query.episode, req.query.chapter, req.query.clear_rank);
            }
            else{
                UpdateOperationData(req.query.id, req.query.episode, req.query.chapter, req.query.clear_rank);
            }
        });
    }

//// Send Module /////////////////////////////////////

    var CheckArknightsLoginData = function(res, sql, params){
        con.query(sql, params, function (error, results, fields) {
            if(results == ''){
                console.log('Result[Check] : fail');
                res.send('check_fail');
            }
            else{     
                console.log('Result[Check] : success');
                var id = "";
                id += results[0].user_id;
                res.send(id);
            }
        });
    }
    
    var CheckGoogleLoginData = function(res, googleEmail, sql, params){
        con.query(sql, params, function (error, results, fields) {
            if(results == ''){
                SignUpGoogleEmail(req, res, googleEmail);
            }
            else{     
                console.log('Result[Check] : success');
                var id = "";
                id += results[0].user_id;
                res.send(id);
            }
        });
    }

    var SignUpArknights = function(req, res, sql, params){
        con.query(sql, params, function (error, results, fields) {
            if(error){
                console.log('Result[SignUp] : fail');
                res.send('signUp_fail');
            }
            else{
                console.log('Result[SignUp] : success');
                ArknightsLogin(req, res);          
            }
        });
    }

    var SignUpGoogleEmail = function(req, res, googleEmail){
        var sql = 'INSERT INTO userdata (google_email) VALUES(?)';
        var params = [googleEmail];

        console.log('Request[SignUp_google] : email -' + googleEmail);
        con.query(sql, params, function (error, results, fields) {
            if(error){
                console.log('Result[SignUp_google] : fail');
                console.log(error);
            }
            else{
                console.log('Result[SignUp_google] : success');
                CheckGoogleLoginData(req, res);
            }
        });
    };

    var LoginResult = function(res, sql, params){
        console.log('ddd');
        con.query(sql, params, function (error, results, fields) {
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
    }

    var SendUserItems = function(res, sql, params){
        con.query(sql, params, function (error, results, fields) {
            if(results == ''){
                console.log('Result[item] : fail');
                res.send('');
            }
            else{     
                console.log('Result[item] : success');
                res.send(results);
            }
        });
    }

    var SendUserOperators = function(res, sql, params){
        con.query(sql, params, function (error, results, fields) {
            if(results == ''){
                console.log('Result[operator] : fail');
                res.send('');
            }
            else{     
                console.log('Result[operator] : success');
                res.send(results);
            }
        });
    }

    var SendShopGoods = function(res, data, menu, sql, params){
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

    var SendUserTeams = function(res, sql, params){
        con.query(sql, params, function (error, results, fields) {
            if(results[0].teams == null){
                var path = './TeamData/Empty_Team.json';
                fs.readFile(path, function(err, data){
                    if(err){
                        res.send('');
                        console.log(err);
                    } 
                    else{   
                        res.send(data.toString());
                    }
                });
            }
            else{
                res.send(results[0].teams);
            }
        });
    }

    var SendUserOperations = function(res, sql, params){
        con.query(sql, params, function (error, results, fields) {
            if(error){
                console.log(error);
            }
            else{     
                console.log('Result[operation] : success');
                res.send(results);
            }
        });
    }

    var InputOperationData = function(id, episode, chapter, clear_rank){
        var sql = 'INSERT INTO operation (clear_user_id, episode, chapter, clear_rank) VALUES(?, ?, ?, ?)';
        var params = [id, episode, chapter, clear_rank];

        con.query(sql, params, function (error, results, fields) {
            if(error){
                console.log(error);
            }
            else{     
                console.log('Result[inputOperationData] : id-' + id + ', operation' + episode + '-' + chapter + ' rank-' + clear_rank);
            }
        });
    }

    var UpdateOperationData = function(id, episode, chapter, clear_rank){
        var sql = 'UPDATE operation SET clear_rank=? WHERE clear_user_id=? AND episode=? AND chapter=? ';
        var params = [clear_rank, id, episode, chapter];

        con.query(sql, params, function (error, results, fields) {
            if(error){
                console.log(error);
            }
            else{     
                console.log('Result[updateOperationData] : id-' + id + ', operation' + episode + '-' + chapter + ' rank-' + clear_rank);
            }
        });
    }

//// GET, POST /////////////////////////////////////

    app.get('/CheckArknightsEmail', ArknightsLogin);
    app.get('/CheckGoogleEmail', GoogleLogin);
    app.get('/Login', Login);
    app.get('/SignUp', SignUp);
    app.get('/Items', Items);
    app.get('/Operators', Operators);
    app.get('/Shop', Shop);
    app.get('/Purchase', Purchase);
    app.get('/Teams', Teams);
    app.post('/TeamsChange', TeamsChange);
    app.get('/Operations', Operations);
    app.get('/OperationClear', OperationClear);
}