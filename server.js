/* 
 * server.js
 * 
 * The main file, to be invoked at the command line. Calls app.js to get 
 * the Express app object.
 */

var app = require('./app').init(5000);
var fs = require('fs');

var redisdb = require('./models/redisdb.js');
var utils = require('./models/formutils.js');

app.get('/', function(req,res){
    utils.locals.date = new Date().toLocaleDateString();
    res.render('home.ejs', utils.locals);
});

var mysql = require('mysql');
var MYSQL_USERNAME = 'root';
var MYSQL_PASSWORD = 'donastia';
var dbName = "eis_graphs";
dbName = "northwind";
// init;
var client = mysql.createConnection({
  user: MYSQL_USERNAME,
  password: MYSQL_PASSWORD,
});

client.query('CREATE DATABASE IF NOT EXISTS ' + dbName + ';', function (err, data)
{
	client.query('USE ' + dbName);
});


/*
app.get('/form', function(req,res){
    utils.locals.date = new Date().toLocaleDateString();
    res.render('form.ejs', locals);
});
*/

app.get('/table', function(req, res){
	res.render('table.ejs', utils.locals);
});

app.get('/form', function(req, res){
	var user = { user_name: 'David', user_email: 'daviddouglaserickson@yahoo.com', gender: 'male'};
    utils.locals['data'] = user;
	res.render('form.ejs', utils.locals);
});



function log (msg)
{
	console.log(msg);
}

function getDBType (key, val)
{
	return "varchar(250)";
}

// SKIP_KEY --> __
var SKIP_KEY = '__';
function isColumn (_key)
{
 return (_key.indexOf (SKIP_KEY) == -1);
}

function getWhereClause (jsonData)
{
	var options = jsonData['__options__'];
	var whereclause = undefined;
	if (options != null)
	{
		whereclause = "";
		var arrFilter = options['filters'];
		for (var i=0; i < arrFilter.length; i++)
		{
			if (whereclause.length > 0)
			{
				whereclause += ' AND ';
			}
			whereclause += arrFilter[i] + '=' + client.escape(jsonData[arrFilter[i]]);
		}
	}
	return whereclause;
} 

function getTablePrefix(jsonData)
{
	return "tbl";
}

function checkauth(req, res, next) {
	console.log(req.session.user);
  	if (!req.session.user) {
    	res.send('You are not authorized to view this page');
  	} else {
    	next();
  	}
}


// var sql = "SELECT `COLUMN_NAME` from INFORMATION_SCHEMA.COLUMNS where table_schema='" + dbName + "' AND table_name= '" + getTablePrefix(jsonData) + tablename + "'";
//	log (sql);

app.get('/tableschema/:tablename', function (req, res){
	var tablename = req.params.tablename;
	var sql = "SELECT `COLUMN_NAME` from INFORMATION_SCHEMA.COLUMNS where table_schema='" + dbName + "' AND table_name= '" + tablename + "';";
	console.log(sql);
	client.query(sql, function (err, data)
	{
		if (data == null)
		{
			data = {};
			data.error = "No Records found.";
		}
		if (req.query.callback != undefined)
		{
			res.send(req.query.callback + '(' + data + ')');
		} else {
			res.send(data);
		}
	});	
});

app.post('/createtable', function (req,res){
	var tablename = 'people';
	var jsonData = req.body;
	console.log(req.postData);
	console.log(jsonData);
	var sql = ""+
				"create table IF NOT EXISTS `" + getTablePrefix(jsonData) + tablename + "` (`"+
				getTablePrefix(jsonData) + tablename + "_id` int unsigned not null auto_increment,";

	for(i in jsonData)
	{
		var _key = i;				
		if (isColumn(_key))
		{
			var val = jsonData[i];					
			var type = getDBType(_key,val);
			if (isNaN(val))
			{
				sql += " `" + _key + "` " + type + " ,"; // not null default ''
			} else {
				sql += " `" + _key + "` " + type + " ,"; // not null default 0
			}
			
		}
	}

	sql += " primary key (`" + getTablePrefix(jsonData) + tablename + "_id`)"+
		");";
	log (sql);
	res.send(sql);
});


app.get('/login', function(req, res){
	var user = { user_name: 'David', user_email: 'daviddouglaserickson@yahoo.com', gender: 'male'};
    utils.locals['data'] = user;
    utils.locals['user'] = user;
	res.render('login.ejs', utils.locals);
});

app.get('/dashboard', function(req, res){
	var user = User(req);
    utils.locals['user'] = user;
    utils.locals['title'] = 'Shopping Bazaar';
	res.render('dashboard.ejs', utils.locals);
});

app.get('/customers', function(req, res){
	var viewname = 'customers';
	var user = { user_name: 'David', user_email: 'daviddouglaserickson@yahoo.com', gender: 'male'};
    utils.locals['data'] = user;
    utils.Message('Form to fill in customer information');
	res.render(viewname + '.ejs', utils.locals);
});

app.get('/david', function (req, res) {
	var formdata = {};
	formdata.CompanyName = "Simplicity1";
	formdata.ContactName = "David Erickson"
	var org = 'org';
	var table = 'customer';

	var arrLookupKeys = [];
	arrLookupKeys.push(formdata.CompanyName);
	arrLookupKeys.push(formdata.ContactName);
	
	redisdb.Exists (org,table,arrLookupKeys, function (err,exists) {
		res.send(exists);
	});
});

app.get('/upload-pictures', checkauth, function(req, res){
	var viewname = 'upload-pictures';
	var user = User(req);
	utils.locals['error'] = '';
    utils.locals['user'] = user;
    utils.Message('Drag Images to Upload');
    utils.locals['js'] = '';
    utils.locals['_layoutFile'] = true;
	res.render(viewname + '.ejs', utils.locals);
});

/*
{ id: '1924f128-ad51-d419-c2fb-231da7602a18',
  CustomerID: '2',
  CompanyName: '3 id was updated on this one yikes...',
  ContactName: '4 b',
  ContactTitle: '5',
  Address: '6',
  City: '7',
  Region: '8',
  PostalCode: '9',
  Country: '10',
  Phone: '11',
  Fax: '12' }
req.session.user

{ user_name: 'David',
  user_email: 'daviddouglaserickson@yahoo.com',
  pwd: '$2a$10$voZK/C8BvACEWGrBavbY9euu1gZ9lWwt3dugikWvduaGOqSgLhSf2',
  gender: 'male',
  id: 'cc19c8d4-5193-882d-98f4-b7ad4461ecd5',
  sys__order: 7 }
*/

app.post('/:category/:subcategory/customer-files',checkauth, function (req, res) {
	console.log("post customer files - " + req.files.file.name);
	console.log(req.session.user);

	var user = User(req);
  	var formdata = {};
  	formdata.userid = user.id;
  	formdata.path = req.files.file.name;
  	formdata.org = user.org;
  	formdata.subcategory = req.params.subcategory;
  	formdata.category = req.params.category;

	var arrLookupKeys = [];
	arrLookupKeys.push(formdata.path);

	var arrSaveKeys = [];
	arrSaveKeys.push(formdata.path);

	var org = user.org;
	var table = 'product-files';

	SaveRecord(org, table, arrLookupKeys, arrSaveKeys, formdata, function (err1, data1)
	{
		console.log(data1);
	});

	res.redirect("back");
	
});

// ret.action = "NewRecord";
// ret.action = "DuplicateRecordOnNewRecord";
// ret.action = "UpdateRecord";
// ret.action = "NoPrimaryKeyOnUpdateRecord";
SaveRecord = function (org, table, arrLookupKeys, arrSaveKeys, formdata, callback)
{
	var ret = {};
	redisdb.Exists (org,table,arrLookupKeys, function (err,exists) {
		if (!exists)
		{
			// SAVES A NEW RECORD
			formdata.id = undefined;

			// BEFORE WE JUMP INTO SAVE WE MAY WANT TO CHECK FOR EXISTING RECORDS AT THIS POINT
			// TODO:// 
			// NEW RECORD CHECK USING THE COMPOSITE KEYS
			// WE DON'T WANT THE USER TO SAVE A NEW RECORD WITH THE SAME CONTACT NAME THAT
			// ALREADY EXISTS...
			redisdb.Exists (org,table,arrSaveKeys, function (err,exists) {
				if (!exists)
				{
					ret.action = "NewRecord";
					redisdb.Save(org,table,formdata, arrSaveKeys, function (err, _data)
					{
						var objJson = JSON.parse( decodeURIComponent( escape ( _data ) ) );
						ret.data = objJson;

						callback (err, ret);
					});
				} else {
					ret.action = "DuplicateRecordOnNewRecord";
					ret.data = formdata;
					callback (null, ret);
				}
			});
		} else {
			// lookup/org/customer/cbf2cdd8-3c07-24c2-84dd-2cfd14886866
			console.log (formdata.id);
			if (formdata.id != undefined)
			{
				ret.action = "UpdateRecord";
				// UPDATES AN EXISTING RECORD ENSURING THAT AN ID HAS ALREADY BEEN ASSIGNED.
				redisdb.Save(org,table,formdata, arrSaveKeys, function (err, _data)
				{
					var objJson = JSON.parse( decodeURIComponent( escape ( _data ) ) );
					ret.data = objJson;
					callback (err, ret);
				});

			} else {
				ret.action = "NoPrimaryKeyOnUpdateRecord";
				ret.data = formdata;
				callback (null, ret);
			}
		}
	});

}

app.post('/customers', function (req, res) {

	var formdata = req.body;
	console.log (formdata);
	var org = 'org';
	var table = 'customer';

	var arrLookupKeys = [];
	arrLookupKeys.push(formdata.id);

	
	var arrSaveKeys = [];

	arrSaveKeys.push(formdata.CompanyName);
	arrSaveKeys.push(formdata.ContactName);
	SaveRecord(org, table, arrLookupKeys, arrSaveKeys, formdata, function (err, data)
	{
		// ret.action = "NewRecord";
		// ret.action = "DuplicateRecordOnNewRecord";
		// ret.action = "UpdateRecord";
		// ret.action = "NoPrimaryKeyOnUpdateRecord";
		console.log(data.action);
		utils.locals['error'] = err;
		switch (data.action)
		{
			case "NewRecord":
				utils.Message('Record saved!');
				utils.locals['data'] = data.data;
				utils.locals['success'] = true;
				res.writeHead(302, {
				  'Location': '/customers'
				  //add other headers here...
				});
				res.end();
			break;
			case "DuplicateRecordOnNewRecord":
				utils.Error('Account already exists. Please enter a new contact name.');
				utils.locals['js'] += utils.FocusElement('ContactName');
				utils.locals['data'] = formdata;	
				res.render('customers.ejs',utils.locals);
			break;
			case "UpdateRecord":
				utils.Message('Account saved!');
				utils.locals['data'] = data.data;
				utils.locals['success'] = true;
				//res.writeHead(302, {
				//  'Location': '/customers'
				  //add other headers here...
				//});
				//res.end();
				res.render('customers.ejs', utils.locals);
			break;
			case "NoPrimaryKeyOnUpdateRecord":
				utils.Error('No Key defined for updating record.');
				utils.locals['data'] = formdata;
				res.render('customers.ejs',utils.locals);
			break;
		}
	});	
});



app.get ('/:org/:table/delete/:value', function (req, res)
{
	var org = req.params.org;
	var table = req.params.table;
	var pkValue = req.params.value;

	var arrLookupKeys = [];
	arrLookupKeys.push(pkValue);

	redisdb.Delete (org,table,arrLookupKeys, function (err,result) {
		if (err != null)
		{
			err.count = result;
			res.send(JSON.stringify(err));
		} else {
			var ret = {};
			ret.count = result;
			res.send(ret);
		}
		
	});

});

app.get('/lookup/:org/:table/:value', function (req, res) {

	var org = req.params.org;
	var table = req.params.table;
	var lookup = req.params.value;
	var arrLookupKeys = [];
	arrLookupKeys.push(lookup);
	//arrLookupKeys.push("David Erickson");
	// lookup/org/customer/1
	// json:org:customer:1
	redisdb.GET (org,table,arrLookupKeys, function (err,objData) {
		res.send (objData);
	});
});

app.post('/login', function(req, res){
	var formdata = req.body;
	var org = 'org';
	var table = 'user';
	var username = formdata.user_name;
	var arrLookupKeys = [];
	arrLookupKeys.push(username);

	redisdb.GET (org,table,arrLookupKeys, function (err,user) {
		if (user == null)
		{
			utils.Warning('User does not exist');
			var ret = {};
			ret['user_email'] = formdata.user_name;
			utils.locals['data'] = ret;
			res.render('login.ejs', utils.locals);
		} else {
			var objJson = JSON.parse( decodeURIComponent( escape ( user ) ) );
			console.log(username);
			var password = objJson.pwd;
			console.log(password);
			utils.comparePassword(formdata.password,String(objJson.pwd), function (err,data)
			{
				if (!data)
				{
					utils.Error ('Wrong Password');
					var ret = {};
					ret['user_email'] = formdata.user_name;
					utils.locals['data'] = ret;
					res.render('login.ejs', utils.locals);
				} else {
					console.log(objJson);
					req.session.user = objJson;
					utils.Warning ('Logged In 2!' + objJson.user_name);
					var ret = {};
					var user = User(req);
    				utils.locals['user'] = user;
					ret['user_email'] = objJson.user_email;
					ret['user_name'] = objJson.user_name
					utils.locals['data'] = ret;
					res.render('dashboard.ejs', utils.locals);
				}
			});
			
			
		}
	});
	
});

app.get('/register', function(req,res){
    utils.locals.date = new Date().toLocaleDateString();
    var user = User(req);
    utils.locals['data'] = user;
    utils.locals['layout'] = false;
    res.render('register.ejs', utils.locals);

    //res.render('register.ejs', utils.locals);
});

/*
{ user_name: 'David',
  user_email: 'daviddouglaserickson@yahoo.com',
  pwd: '****',
  cpwd: '****',
  gender: 'male' }
*/
app.post('/register', function(req, res){
	var formdata = req.body;
	var username = formdata.user_email;
	var password = formdata.pwd;

	var org = 'org';
	var table = 'user';


	utils.cryptPassword(password, function (err,data){
		formdata.pwd = data;
		delete formdata.cpwd;
		console.log(err);
		console.log(data);
		console.log(formdata);
	
		var arrLookupKeys = [];
		arrLookupKeys.push(formdata.user_email);

		var arrSaveKeys = [];
		arrSaveKeys.push(formdata.user_email);

		redisdb.Exists (org,table,arrLookupKeys, function (err,exists) {
			if (!exists)
			{
				redisdb.Save(org,table,formdata, arrSaveKeys, function (err, _data)
				{
					var objJson = JSON.parse( decodeURIComponent( escape ( _data ) ) );
					utils.Message('Account saved!');
					utils.locals['data'] = objJson;
					res.render('register.ejs', utils.locals);
				});
			} else {
				utils.Error('Account already exists. Please enter a new email address.');
				utils.locals['js'] = utils.FocusElement('user_email');
				utils.locals['data'] = formdata;
				res.render('register.ejs',utils.locals);
			}
		});
	});
});


function makeid()
{
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
/*
{ user_name: 'David',
  user_email: 'daviddouglaserickson@yahoo.com',
  pwd: '****',
  cpwd: '****',
  gender: 'male' }
*/
app.get('/redistest', function (req,res) {
	var json = { 
		user_name: makeid() + Math.floor((Math.random()*10)+1),
		user_email: makeid() + Math.floor((Math.random()*10)+1) + '@yahoo.com',
		pwd: 'banana',
		gender: 'male'
	};

	var org = 'org';
	var table = 'user';
	var username = json.username;

	var arrLookupKeys = [];
	arrLookupKeys.push('user_email');
	redisdb.Save (org,table,json, arrLookupKeys, function (err,data) {
		if (data != null)
		{
			res.send(data );		
		} else {
			res.send(err);
		}
	});
});

app.get('/getredis/:key', function (req,res) {
	console.log("********" + redisdb.GetKey(req.params.key));
	res.send(redisdb.GetKey(req.params.key));
	console.log(req.params.key);
	redisdb.GetKey(req.params.key, function (err, data)
	{
		//res.send(data);
	});	
});

app.get('/setredis/:key/:value', function (req,res) {
	console.log(req.params.key);
	console.log(req.params.value);
	res.send(redisdb.SetKey(req.params.key, req.params.value));
});

app.get('/family/:search', function (req,res) {
	console.log(req.params.search);
	client.query("SELECT name as label, ID as value FROM eis_graphs.family WHERE name like '%" + req.params.search + "%';", function (err, data)
	{
		if (data == null)
		{
			data = {};
			data.error = "No Records found.";
		}
		if (req.query.callback != undefined)
		{
			res.send(req.query.callback + '(' + data + ')');
		}
		res.send(data);
	});
});

app.get('/admin/:org/:table', function (req, res)
{
	var org = req.params.org;
	var table = req.params.table;
	var prefix = '';
	var tablename = prefix + table;
	var sql = "SELECT * from INFORMATION_SCHEMA.COLUMNS where table_schema='" + dbName + "'";
	sql += " AND table_name= '" + tablename + "'"
	console.log(sql);
	client.query(sql, function (err, data)
	{
		res.send(data);
	});
	//req.send(sql);
});

app.get('/admin/:org/:table/:file', function (req, res)
{
	var org = req.params.org;
	var table = req.params.table;
	var prefix = '';
	var tablename = prefix + table;
	var sql = "SELECT * from INFORMATION_SCHEMA.COLUMNS where table_schema='" + dbName + "'";
	sql += " AND table_name= '" + tablename + "'"
	console.log(sql);

	var ret = '';
	var linebreak = '\n';
	

	client.query(sql, function (err, arrData)
	{
		console.log(arrData);
		// console.log(JSON.parse(arrData).length);
		ret ='<form class="form-horizontal" method="post" action="/' + tablename + '">';
		ret += linebreak;
		ret += '<fieldset>';
		ret += linebreak;
		ret += '<legend>' + tablename + '</legend>';
			
		for (var i=0; i < arrData.length; i++)
		{
			var data = arrData[i];
			var template = '<div class="control-group">';
			template += linebreak;
			template += '<label class="control-label" for="input01">' + data.COLUMN_NAME + '</label>';
			template += linebreak;
			template += '<div class="controls">';
			template += linebreak;
			template += '<input type="text" class="input-xlarge" id="' + data.COLUMN_NAME + '" name="' + data.COLUMN_NAME + '" rel="popover" data-content="Enter your ' + data.COLUMN_NAME + '." data-original-title="' + data.COLUMN_NAME + '">';
			template += linebreak;
			template += '</div>';
			template += linebreak; 
			template += '</div>';
			ret += linebreak;
			ret += template;
		}
		ret += linebreak;
		ret += "</fieldset>";
		ret += linebreak;
		ret += "</form>";
		ret += linebreak;
		res.send('<textarea>' + ret + '</textarea>');
	});
	//req.send(sql);
});




app.get('/admin/view/tables/:org', function (req, res)
{
	var org = req.params.org;
	var table = req.params.table;
	var prefix = '';
	var tablename = prefix + table;
	var sql = "SELECT `TABLE_NAME` from INFORMATION_SCHEMA.COLUMNS where table_schema='" + dbName + "' GROUP BY TABLE_NAME";
	// sql += " AND table_name= '" + tablename + "'"
	log (sql);
	client.query(sql, function (err, data)
	{
		res.send(data);
	});
	//req.send(sql);
});

User = function (req) {
	return req.session.user;
}
app.get('/redislist/:skip/:take', function (req,res) {
	
	console.log(req.session.user);
	console.log(User(req));
	var org = 'org';
	var table = 'user';

	redisdb.ListLimit (org,table,'id', 'desc', '', parseInt(req.params.skip), parseInt(req.params.take), function (err,data) {
		if (data != null)
		{
			var lst = [];
			var cnt = data.length;
			for (var i=0; i < cnt; i++)
			{
				var json_obj = data[i];
				var retObj = JSON.parse( decodeURIComponent( escape ( json_obj ) ) );
				lst.push(retObj);
			}
			var ret = {};
			ret.data = lst;
			ret.error = null;
			ret.count = cnt;
			res.send(ret);		
		} else {
			res.send(err);
		}
	});
});

app.get('/:org/:table/:sortby/:direction/list', function (req,res) {
	
	var org = req.params.org;
	var table = req.params.table;
	if (table.length > 1)
	{
		var n = table.charAt(table.length-1);
		if (n == 's')
		{
			table = table.substring(0,table.length - 1);
		}
	}
	redisdb.List (org,table,req.params.sortby,req.params.direction, function (err,data) {
		if (data != null)
		{
			var lst = [];
			var cnt = data.length;
			for (var i=0; i < cnt; i++)
			{
				var json_obj = data[i];
				var retObj = JSON.parse( decodeURIComponent( escape ( json_obj ) ) );
				lst.push(retObj);
			}
			var ret = {};
			ret.success = true;
			ret.data = lst;
			ret.error = null;
			ret.count = cnt;
			res.send(ret);		
		} else {
			var ret = {};
			ret.error = err;
			res.send(ret);
		}
	});
});

app.get('/:org/:table/:sortby/:direction/:skip/:take/list', function (req,res) {
	
	var org = req.params.org;
	var table = req.params.table;

	redisdb.ListLimit (org,table,req.params.sortby,req.params.direction, '', parseInt(req.params.skip), parseInt(req.params.take), function (err,data) {
		if (data != null)
		{
			var lst = [];
			var cnt = data.length;
			for (var i=0; i < cnt; i++)
			{
				var json_obj = data[i];
				var retObj = JSON.parse( decodeURIComponent( escape ( json_obj ) ) );
				lst.push(retObj);
			}
			var ret = {};
			ret.success = true;
			ret.data = lst;
			ret.error = null;
			ret.count = cnt;
			res.send(ret);		
		} else {
			var ret = {};
			ret.error = err;
			res.send(ret);
		}
	});
});

/* The 404 Route (ALWAYS Keep this as the last route) */
app.get('/*', function(req, res){
    res.render('404.ejs', utils.locals);
});