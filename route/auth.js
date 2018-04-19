const fs = require('fs');
const multer = require('multer');
const conn = require('../config/database')();
const route = require('express').Router();
const bcrypt = require('bcrypt');
const api_key = require('../config/api_key.json');
const nodemailer = require('nodemailer');

// 이메일 발송
const sendEmail = (email, authToken, tempMessage) => {
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
		to: email,
		subject: 'test',
		html: tempMessage,
	};

	const sql = 'INSERT INTO temp SET ?';
	return conn.query(sql, authToken, (err) => {
		if (err) {
			console.log(err);
		} else {
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					console.log(error);
					return false;
				}
				console.log('Message sent: %s', info.messageId);
				// Preview only available when sending through an Ethereal account
				console.log('Preview URL: %s', info.response);
				return true;
				// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
				// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
			});
		}
	});
};

// 비밀번호 체크
function checkPassword(password) {
	if (password.length < 8) {
		const msg = '비밀번호는 8자이상 입력해주세요';
		return msg;
	}

	if (!/[~!@#$%^&*()_+|<>?:{}]/.test(password)) {
		const msg = '특수문자를 사용해주세요';
		return msg;
	}
	const checkNumber = password.search(/[0-9]/g);
	const checkEnglish = password.search(/[a-z]/ig);

	if (checkNumber < 0 || checkEnglish < 0) {
		const msg = '숫자와 영문자를 혼용하여야 합니다';
		return msg;
	}

	if (/(\w)\1\1\1/.test(password)) {
		const msg = '같은 문자를 연속 4번 이상 사용하실 수 없습니다';
		return msg;
	}
	return 'success';
}

module.exports = (passport) => {
	const storage_setting = multer.diskStorage({
		destination(req, file, cb) {
			const user_email = req.body.email;
			console.log('user_email: ' + user_email);
			console.log('name: ' + file.originalname);
			if (!fs.existsSync(`./public/images/userprofile/${user_email}`)) {
				fs.mkdirSync(`./public/images/userprofile/${user_email}`);
				fs.mkdirSync(`./public/images/userprofile/${user_email}/profilePicture`);
			}
			cb(null, `./public/images/userprofile/${user_email}/profilePicture/`);
		},
		filename(req, file, cb) {
			cb(null, file.originalname);
		},
	});
	const upload = multer({
		storage: storage_setting,
	});
	const saltRounds = 12;


	// local
	route.post(
		'/login',
		passport.authenticate('local', {
			successRedirect: '/index',
			failureRedirect: '/auth/register',
			failureFlash: false,
		}),
	);

	// google login
	route.get('/google', passport.authenticate('google', {
		scope: ['openid', 'email'],
	}));
	route.get(
		'/google/callback',
		passport.authenticate('google', {
			failureRedirect: '/index',
		}),
		(req, res) => {
			req.session.save(() => {
				res.redirect('/index');
			});
		},
	);

	// facebook login
	route.get('/facebook', passport.authenticate('facebook'));
	route.get(
		'/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect: '/index',
			failureRedirect: '/index',
		}),
	);

	// github login
	route.get('/github', passport.authenticate('github', {
		scope: ['user:email'],
	}));
	route.get(
		'/github/callback',
		passport.authenticate('github', {
			failureRedirect: '/index',
		}),
		(req, res) => {
			req.session.save(() => {
				res.redirect('/index');
			});
		},
	);

	// 이메일 인증 요청 보내기
	route.post('/send', (req, res) => {
		const { email } = req.body;
		const timestamp = Date.now();
		const email_check = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;

		if (email === '') {
			return res.send('email_null');
		}

		if (email_check.test(email) === false) {
			return res.send('email_incorrect');
		}

		return bcrypt.hash(email, saltRounds, (err, hash) => {
			const mailHash = hash.replace(/\//gi, '');

			const authToken = {
				email,
				mailHash,
				time: timestamp,
			};
			const tempLink = `localhost/auth/confirm/${mailHash}`;
			const tempMessage = `<p>인증하시려면 다음 링크를 클릭하세요</p><p> <a href="http://${tempLink}">${tempLink}</a> </p>`;
			console.log('test');
			if (sendEmail(email, authToken, tempMessage)) {
				console.log('hi');
				res.send('success');
			} else {
				console.log('fe');
				res.send('fail');
			}
		});
	});

	// 요청 제한시간 확인 및 인증상태 업데이트
	route.get('/confirm/:mailHash', (req, res) => {
		const timestamp = Date.now() - 3600000;
		const { mailHash } = req.params;
		console.log(`hi${mailHash}`);
		const sql = 'SELECT * FROM temp WHERE mailHash=? AND time>=?';
		conn.query(sql, [mailHash, timestamp], (err, results) => {
			const result = results[0];
			if (result) {
				const qmail = result.mailHash;
				const sql = "UPDATE temp SET authentication='confirmed' WHERE mailHash=?";
				conn.query(sql, [qmail], (err) => {
					if (err) {
						console.log(err);
					} else {
						res.redirect(`/auth/authentication/${mailHash}`);
					}
				});
			} else {
				res.send('인증시간이 만료되었습니다');
			}
		});
	});

	// 인증 확인 페이지
	route.get('/authentication/:mailHash', (req, res) => {
		const { mailHash } = req.params;
		const sql = 'SELECT authentication FROM temp WHERE mailHash=?';
		conn.query(sql, [mailHash], (err, results) => {
			const result = results[0];
			res.render('authentication', {
				result,
			});
		});
	});

	// register
	route.post('/register_check', (req, res) => {
		const { email } = req.body;
		const pwd = req.body.password;

		if (email === '') {
			return res.send('email_null');
		}
		const sql = 'SELECT * FROM users WHERE email=?';
		return conn.query(sql, [email], (err, results) => {
			if (err) {
				return console.log(err);
			}
			const result = results[0];
			if (result) {
				return res.send('exist user');
			}
			const sql = 'SELECT authentication FROM temp WHERE email=?';
			return conn.query(sql, [email], (err, results) => {
				const len = results.length;
				const result = results[len - 1];
				console.log('result: ' + result);
				if (result) {
					console.log('result.authentication' + result.authentication);
					if (!result.authentication) {
						console.log('authentication');
						return res.send('not confirmed');
					}
					if (checkPassword(pwd) !== 'success') {
						return res.send(checkPassword(pwd));
					}
					return res.send('success');
				}
				console.log('how?');
				return res.send('not confirmed');
			});
		});
	});

	route.post('/register', upload.single('profile'), (req, res) => {
		console.log('regi');
		console.log('req.body.profile: ' + req.body.profile);
		console.log('req.body.email: ' + req.body.email);
		let filename = '';
		if (req.file) {
			filename = req.file.originalname;
			console.log(filename);
		}
		const { email } = req.body;
		const authId = `local:${email}`;
		const pwd = req.body.password;
		const dpname = req.body.displayName;
		bcrypt.hash(pwd, saltRounds, (err, hash) => {
			const userInfo = {
				authId,
				hash,
				displayName: dpname,
				email,
				profilePicture: filename,
			};
			const sql = 'INSERT INTO users SET ?';
			conn.query(sql, userInfo, (err) => {
				if (err) {
					console.log(err);
				} else {
					req.login(userInfo, () => {
						req.session.save(() => {
							res.redirect('/index');
						});
					});
				}
			});
		});
	});

	route.get('/register', (req, res) => {
		if (req.user) {
			res.redirect('/index');
		} else {
			res.render('register');
		}
	});

	// 비밀번호 찾기
	route.post('/findpwd', (req, res) => {
		const { email } = req.body;
		const timestamp = Date.now();
		const sql = 'SELECT email FROM users WHERE email=?';
		conn.query(sql, [email], (err, results) => {
			if (err) {
				console.log(err);
			}
			const result = results[0];
			if (result) {
				console.log(`results: ${JSON.stringify(results)}`);
				console.log(`result :${result.email}`);
				bcrypt.hash(email, saltRounds, (err, hash) => {
					const mailHash = hash.replace(/\//gi, '');
					const hashLen = mailHash.length;
					const miniHash = mailHash.substring(hashLen - 16, hashLen);
					const tempUrl = mailHash.substring(0, hashLen - 16);
					const authToken = {
						email,
						mailHash,
						time: timestamp,
					};
					const tempMessage = `인증번호: ${miniHash}`;

					sendEmail(email, authToken, tempMessage);
					res.redirect(`/auth/checkuser/${tempUrl}`);
				});
			} else {
				res.send('존재하지않는 유저');
			}
		});
	});

	route.get('/findpwd', (req, res) => {
		res.render('findpwd');
	});

	route.post('/checkuser/:tempHash', (req, res) => {
		const CN = req.body.certificationNumber;
		const { tempHash } = req.params;
		const mailHash = tempHash + CN;
		const sql = 'SELECT mailHash FROM temp WHERE mailHash=?';
		conn.query(sql, [mailHash], (err, results) => {
			const result = results[0];
			if (result) {
				console.log(`checkuser result: ${result}`);
				const len = result.mailHash.length;
				const check = result.mailHash.substring(len - 16, len);

				if (check === CN) {
					res.send('성공');
				} else {
					res.send('인증번호를 다시 발송해주세요');
				}
			} else {
				res.send('인증번호가 틀립니다');
			}
		});
	});

	route.get('/checkuser/:mailHash', (req, res) => {
		const { mailHash } = req.params;
		res.render('checkuser', {
			mailHash,
		});
	});

	// 로그아웃
	route.get('/logout', (req, res) => {
		req.logout();
		res.redirect('/index');
	});

	return route;
};
