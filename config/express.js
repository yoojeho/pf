const express = require('express');
const session = require('express-session');

const app = express();
const conn = require('./database')();
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const db_config = require('./db_config.json');
const schedule = require('node-schedule');

schedule.scheduleJob('0 0 * * *', () => {
	const nowtime = Date.now();
	const time = nowtime - 86400000;
	const d = new Date();
	const sql = 'DELETE FROM temp WHERE time>=?';
	// 매일 0시에 생성된지 하루가 지난 정보 초기화
	conn.query(sql, [time], (err, results) => {
		if (err) {
			return console.log(err);
		}
		return console.log(`delete temp, affectedRows: ${results.affectedRows} / time: ${d.getHours()}:${d.getMinutes()}/ ${d.getFullYear()}년 ${parseInt(d.getMonth() + 1, 10)}월 ${d.getDate()}일`);
	});
});
app.set('view engine', 'pug');
app.set('views', './views/pug');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
	extended: false,
}));

app.use(session({
	secret: 'anything',
	resave: false,
	saveUninitialized: true,
	store: new MySQLStore({
		host: db_config.host,
		port: db_config.port,
		user: db_config.user,
		password: db_config.password,
		database: db_config.database,
	}),
}));

function getApp() {
	return app;
}

module.exports = getApp;
