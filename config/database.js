var mysql = require('mysql');
var db_config = require('./db_config.json');
var conn = mysql.createConnection({
	host: db_config.host,
	user: db_config.user,
	password: db_config.password
});

conn.connect(function (err) {
	console.log("Connected DB");

	var sql = "CREATE DATABASE IF NOT EXISTS pf";
	conn.query(sql, function (err, result) {
		if (err) console.log("create pf database error => " + err);
		var sql = "USE pf";
		conn.query(sql, function (err, result) {
			var sql = "CREATE TABLE IF NOT EXISTS users (authId VARCHAR(40) not null PRIMARY KEY, displayName VARCHAR(20) not null, email VARCHAR(30), hash VARCHAR(255), profilePicture VARCHAR(15))";
			conn.query(sql, function (err, result) {
				if (err) console.log("create users table error => " + err);
			})

			var sql = "CREATE TABLE IF NOT EXISTS temp (email VARCHAR(30), mailHash VARCHAR(255), time VARCHAR(20), authentication VARCHAR(10))";
			conn.query(sql, function (err, result) {
				if (err) console.log("create temp table error => " + err);
			})

			var sql = "CREATE TABLE IF NOT EXISTS posts (post_number INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(30) not null, content VARCHAR(255), displayName VARCHAR(15) not null, authId VARCHAR(40) not null)";
			conn.query(sql, function (err, result) {
				if (err) console.log("create posts table error => " + err);
			})

			var sql = "CREATE TABLE IF NOT EXISTS comments (comment_number VARCHAR(10) not null, post_number VARCHAR(10) not null, content VARCHAR(255), displayName VARCHAR(15) not null)";
			conn.query(sql, function (err, result) {
				if (err) console.log("create comments table error => " + err);
			})
		})
	})
});

function getConn() {
	return conn;
}

module.exports = getConn