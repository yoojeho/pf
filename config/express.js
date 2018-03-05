module.exports = function () {
	var express = require('express');
	var session = require('express-session');
	var app = express();
	var conn = require('./database')();
	var MySQLStore = require('express-mysql-session')(session);
	var bodyParser = require('body-parser');
	var db_config = require('./db_config.json');
	var schedule = require('node-schedule');
	var scheduler = schedule.scheduleJob('* 0 * * *', function () {
		var nowtime = Date.now();
		var time = nowtime - 86400000;
		var d = new Date();

		var sql = 'DELETE FROM temp WHERE time>=?';
		//매일 0시에 생성된지 하루가 지난 정보 초기화
		conn.query(sql, [time], function (err, results) {
			if (err) {
				return console.log(err);
			} else {
				return console.log('delete temp, nowtime: '+ nowtime + ' time: ' + d.getHours() + ':' +d.getMinutes());
			}
		})
	});
	app.set('view engine', 'pug');
	app.set('views', './views/pug');
	app.use(express.static('public'));
	app.use(bodyParser.urlencoded({ extended: false }));

	app.use(session({
		secret: 'anything',
		resave: false,
		saveUninitialized: true,
		store: new MySQLStore({
			host: db_config.host,
			port: db_config.port,
			user: db_config.user,
			password: db_config.password,
			database: db_config.database
		})
	}));

	return app;
}