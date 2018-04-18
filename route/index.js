const route = require('express').Router();
const conn = require('../config/database')();

module.exports = () => {
	route.get('/', (req, res) => {
		const { user } = req;

		if (user) {
			const { authId } = user;
			const { email } = user;
			const sql = 'SELECT * FROM users WHERE authId=?';
			conn.query(sql, [authId], (err, results) => {
				const { profilePicture } = results[0];
				const pP = 'images/userprofile/' + email + '/profilePicture/' + profilePicture;
				res.render('about_me', {
					user: user,
					pP: pP,
				});
			});
		} else {
			res.render('about_me');
		}
	});

	// contact 제출시
	route.post('/contact_submit', (req, res) => {
		const { email } = req.body;
		const { title } = req.body;
		const { message } = req.body;
		if (email === '') return res.send('email_null');
		if (email === 'invalid') return res.send('email_invalid');
		if (title === '') return res.send('title_null');
		if (message === '') return res.send('message_null');
		const d = new Date();
		const time = `${d.getFullYear()}년${parseInt(d.getMonth() + 1, 10)}월${d.getDate()}일 ${d.getHours()}:${d.getMinutes()}`;
		const contact_form = {
			email,
			title,
			message,
			time,
		};
		const sql = 'INSERT INTO contacts SET ?';
		return conn.query(sql, contact_form, (err) => {
			if (err) {
				console.log(err);
				return res.send('err');
			}
			return res.send('success');
		});
	});

	return route;
};
