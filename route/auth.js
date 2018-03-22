module.exports = function (passport) {
	var fs = require('fs');
	var multer = require('multer');
	var conn = require('../config/database')();
	var route = require('express').Router();
	var bcrypt = require('bcrypt');
	var api_key = require('../config/api_key.json');
	var nodemailer = require('nodemailer');
	var _storage = multer.diskStorage({
		destination: function (req, file, cb) {
			var email = req.body.email;
			if (!fs.existsSync('./public/images/userprofile/' + email)) {
				fs.mkdirSync('./public/images/userprofile/' + email);
				fs.mkdirSync('./public/images/userprofile/' + email + '/profilePicture');

			}
			cb(null, '/public/images/userprofile/' + email + '/profilePicture/')
		},
		filename: function (req, file, cb) {
			cb(null, file.originalname);
		}
	})
	var upload = multer({ storage: _storage });
	const saltRounds = 12;


	//local
	route.post(
		'/login',
		passport.authenticate(
			'local', {
				successRedirect: '/index',
				failureRedirect: '/auth/register',
				failureFlash: false
			}
		)
	);

	//google login
	route.get('/google', passport.authenticate('google', {
		scope: ['openid', 'email']
	}));
	route.get('/google/callback',
		passport.authenticate(
			'google', {
				failureRedirect: '/index'
			}),
		function (req, res) {
			req.session.save(function (err) {
				res.redirect('/index');
			});
		}
	);

	//facebook login
	route.get('/facebook', passport.authenticate('facebook'));
	route.get('/facebook/callback',
		passport.authenticate(
			'facebook', {
				successRedirect: '/index',
				failureRedirect: '/index'
			}
		)
	);

	//github login
	route.get('/github', passport.authenticate('github', {
		scope: ['user:email']
	}));
	route.get('/github/callback',
		passport.authenticate(
			'github', {
				failureRedirect: '/index'
			}),
		function (req, res) {
			req.session.save(function (err) {
				res.redirect('/index');
			});
		}
	);

	//이메일 인증 요청 보내기
	route.post('/send', function (req, res) {
		var email = req.body.email;
		var timestamp = Date.now();
		bcrypt.hash(email, saltRounds, function (err, hash) {
			var mailHash = hash.replace(/\//gi, '');

			var authToken = {
				email: email,
				mailHash: mailHash,
				time: timestamp
			}
			var tempLink = 'localhost/auth/confirm/' + mailHash;
			var tempMessage = '<p>인증하시려면 다음 링크를 클릭하세요</p><p> <a href="http://' + tempLink + '">' + tempLink + '</a> </p>';
			sendMail(email, authToken, tempMessage);
			res.send('su');
		});
	});

	//요청 제한시간 확인 및 인증상태 업데이트
	route.get('/confirm/:mailHash', function (req, res) {
		var timestamp = Date.now() - 3600000;
		var mailHash = req.params.mailHash;
		console.log('hi'+ mailHash);
		var sql = "SELECT * FROM temp WHERE mailHash=? AND time>=?";
		conn.query(sql, [mailHash, timestamp], function (err, results) {
			var result = results[0];
			if (result) {
				var qmail = result.mailHash;
				var sql = "UPDATE temp SET authentication='confirmed' WHERE mailHash=?";
				conn.query(sql, [qmail], function (err, results) {
					if (err) {
						console.log(err);
					} else {
						res.redirect('/auth/authentication/' + mailHash);
					}
				})
			} else {
				res.send('인증시간이 만료되었습니다');
			}
		})
	})

	//인증 확인 페이지
	route.get('/authentication/:mailHash', function (req, res) {
		var mailHash = req.params.mailHash;
		var sql = "SELECT authentication FROM temp WHERE mailHash=?";
		conn.query(sql, [mailHash], function (err, results) {
			var result = results[0];
			res.render('authentication', {
				result: result
			});
		})
	})

	//register
	route.post('/register', upload.single('profile'), function (req, res) {
		if (req.file) var filename = req.file.originalname;
		var email = req.body.email;
		var authId = 'local:' + email;
		var pwd = req.body.password;
		var dpname = req.body.displayName;

		if (!checkPassword(pwd)) {
			console.log('비밀번호 오류');
			return res.send('비밀번호 오류');
		}
		var sql = 'SELECT * FROM users WHERE email=?';
		conn.query(sql, [email], function (err, results) {
			if (err) {
				console.log(err);
			}
			var result = results[0];
			if (result) {
				console.log("존재하는유저");
				return res.send('존재하는 유저');
			} else {
				var sql = 'SELECT authentication FROM temp WHERE email=?';
				conn.query(sql, [email], function (err, results) {
					var result = results[0];
					console.log('result: '+result);
					if (result) {
						if (!result.authentication) {
							return res.send('인증되지 않은 메일');
						}
						bcrypt.hash(pwd, saltRounds, function (err, hash) {
							var userInfo = {
								authId: authId,
								hash: hash,
								displayName: dpname,
								email: email,
								profilePicture: filename
							};
							var sql = 'INSERT INTO users SET ?';
							conn.query(sql, userInfo, function (err, results) {
								if (err) {
									console.log(err);
								} else {
									req.login(userInfo, function (err) {
										req.session.save(function () {
											res.redirect('/index');
										});
									});
								}
							})
						});
					} else {
						return res.send("인증되지않은 이메일");
					}
				})
			}
		})
	});
	route.get('/register', function (req, res) {
		if (req.user) {
			res.redirect('/index');
		} else {
			res.render('register');
		}
	});

	//비밀번호 찾기
	route.post('/findpwd', function (req, res) {
		var email = req.body.email;
		var timestamp = Date.now();
		var sql = 'SELECT email FROM users WHERE email=?';
		conn.query(sql, [email], function (err, results) {
			if (err) {
				console.log(err);
			}
			var result = results[0];
			if (result) {
				console.log('results: ' + JSON.stringify(results));
				console.log('result :' + result.email);
				bcrypt.hash(email, saltRounds, function (err, hash) {
					var mailHash = hash.replace(/\//gi, '');
					var hashLen = mailHash.length;
					var miniHash = mailHash.substring(hashLen - 16, hashLen);
					var tempUrl = mailHash.substring(0, hashLen - 16);
					var authToken = {
						email: email,
						mailHash: mailHash,
						time: timestamp
					}
					var tempMessage = '인증번호: ' + miniHash;

					sendMail(email, authToken, tempMessage);
					res.redirect('/auth/checkuser/' + tempUrl);
				});
			} else {
				res.send('존재하지않는 유저');
			}
		})
	});

	route.get('/findpwd', function (req, res) {
		res.render('findpwd');
	});

	route.post('/checkuser/:tempHash', function (req, res) {
		var CN = req.body.certificationNumber;
		var tempHash = req.params.tempHash;
		var mailHash = tempHash + CN;
		var sql = 'SELECT mailHash FROM temp WHERE mailHash=?'
		conn.query(sql, [mailHash], function (err, results) {
			var result = results[0];
			if (result) {
				console.log("checkuser result: " + result);
				var len = result.mailHash.length;
				var check = result.mailHash.substring(len - 16, len);

				if (check == CN) {
					res.send('성공');
				} else {
					res.send('인증번호를 다시 발송해주세요');
				}
			} else {
				res.send('인증번호가 틀립니다');
			}
		})
	});

	route.get('/checkuser/:mailHash', function (req, res) {
		var mailHash = req.params.mailHash;
		res.render('checkuser', { mailHash: mailHash });
	});

	//로그아웃
	route.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/index');
	});

	//contact 메일 발송
	route.post('/contact_submit', function (req, res) {
		
	})

	//비밀번호 체크
	function checkPassword(password) {
		if (password.length < 8) {
			console.log('비밀번호는 8자이상 입력해주세요')
			return false;
		}

		if (!/[~!@#$%^&*()_+|<>?:{}]/.test(password)) {
			console.log('특수문자를 사용해주세요.');
			return false;
		}
		var checkNumber = password.search(/[0-9]/g);
		var checkEnglish = password.search(/[a-z]/ig);

		if (checkNumber < 0 || checkEnglish < 0) {
			console.log("숫자와 영문자를 혼용하여야 합니다.");
			return false;
		}

		if (/(\w)\1\1\1/.test(password)) {
			console.log('같은 문자를 연속 4번 이상 사용하실 수 없습니다.');
			return false;
		}
		return true;
	}

	//이메일 발송
	function sendMail(email, authToken, tempMessage) {
		var transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			auth: {
				user: api_key.gmailAuth.user,
				pass: api_key.gmailAuth.pass
			}
		});

		var mailOptions = {
			from: api_key.gmailAuth.user,
			to: email,
			subject: 'test',
			html: tempMessage
		}

		var sql = 'INSERT INTO temp SET ?';
		conn.query(sql, authToken, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				transporter.sendMail(mailOptions, (error, info) => {
					if (error) {
						return console.log(error);
					}
					console.log('Message sent: %s', info.messageId);
					// Preview only available when sending through an Ethereal account
					console.log('Preview URL: %s', info.response);

					// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
					// Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
				});
			}
		})
	}

	return route;
}