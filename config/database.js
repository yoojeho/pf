const mysql = require('mysql');
const db_config = require('./db_config.json');

module.exports = () => {
	const conn = mysql.createPool({
		host: db_config.host,
		user: db_config.user,
		password: db_config.password,
		database: db_config.database,
	});

	conn.getConnection((err, connection) => {
		// Use the connection
		connection.query('SELECT * FROM users', (error) => {
			// And done with the connection.
			connection.release();

			// Handle error after the release.
			if (error) throw error;

			// Don't use the connection here, it has been returned to the pool.
		});
	});

	return conn;
};

