const route = require('express').Router();
const conn = require('../config/database')();
const api_key = require('../config/api_key.json');
const nodemailer = require('nodemailer');

// 이메일 발송
const sendContactMail = (Message) => {
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		auth: {
			user: api_key.gmailAuth.user,
			pass: api_key.gmailAuth.pass,
		},
	});

	const mailOptions = {
		from: api_key.gmailAuth.user,
		to: api_key.gmailAuth.naver_mail,
		subject: '유저 문의 메일',
		html: Message,
	};

	transporter.sendMail(mailOptions, (error) => {
		if (error) {
			console.log(error);
			return false;
		}
		return true;
		// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
		// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
	});
};

module.exports = () => {
	route.get('/', (req, res) => {
		const { user } = req;
		const map_key = JSON.stringify(api_key.google.map_key);
		if (user) {
			const { authId } = user;
			const { email } = user;
			const sql = 'SELECT * FROM users WHERE authId=?';
			conn.query(sql, [authId], (err, results) => {
				const { profilePicture } = results[0];
				let pP;
				if (profilePicture) {
					pP = 'images/userprofile/' + email + '/profilePicture/' + profilePicture;
				} else {
					pP = 'images/userprofile/nopp/user.png';
				}
				res.render('about_me', {
					user: user,
					pP: pP,
					map_key,
				});
			});
		} else {
			res.render('about_me', {
				map_key,
			});
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
			const sendMessage = `<p>Email : ${email} </p><p>Title : ${title}</p><p>Message : ${message}</p>`;

			sendContactMail(sendMessage);
			return res.send('success');
		});
	});

	return route;
};
