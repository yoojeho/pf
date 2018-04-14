const mysql = require('mysql');
const db_config = require('./db_config.json');

const conn = mysql.createConnection({
	host: db_config.host,
	user: db_config.user,
	password: db_config.password,
});

conn.connect(() => {
	console.log('Connected DB');
	const sql = 'CREATE DATABASE IF NOT EXISTS pf';
	conn.query(sql, (err) => {
		if (err) console.log(`create pf database erroror => ${err}`);
		const sql = 'USE pf';
		conn.query(sql, () => {
			const users_sql = 'CREATE TABLE IF NOT EXISTS users (authId VARCHAR(40) not null PRIMARY KEY, displayName VARCHAR(20) not null, email VARCHAR(30), hash VARCHAR(255), profilePicture VARCHAR(15))';
			conn.query(users_sql, (err) => {
				if (err) console.log(`create users table erroror => ${err}`);
			});

			const temp_sql = 'CREATE TABLE IF NOT EXISTS temp (email VARCHAR(30), mailHash VARCHAR(255), time VARCHAR(20), authentication VARCHAR(10))';
			conn.query(temp_sql, (err) => {
				if (err) console.log(`create temp table erroror => ${err}`);
			});

			const posts_sql = 'CREATE TABLE IF NOT EXISTS posts (post_number INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(30) not null, content VARCHAR(255), displayName VARCHAR(15) not null, authId VARCHAR(40) not null)';
			conn.query(posts_sql, (err) => {
				if (err) console.log(`create posts table erroror => ${err}`);
			});

			const comments_sql = 'CREATE TABLE IF NOT EXISTS comments (comment_number VARCHAR(10) not null, post_number VARCHAR(10) not null, content VARCHAR(255), displayName VARCHAR(15) not null)';
			conn.query(comments_sql, (err) => {
				if (err) console.log(`create comments table erroror => ${err}`);
			});

			const contacts_sql = 'CREATE TABLE IF NOT EXISTS contacts (email VARCHAR(30) not null, title VARCHAR(255) not null, message VARCHAR(2000) not null, time VARCHAR(40) not null)';
			conn.query(contacts_sql, (err) => {
				if (err) console.log(`create contacts table erroror => ${err}`);
			});
		});
	});
});

function getConn() {
	return conn;
}

module.exports = getConn;
