module.exports = function (app) {
	var conn = require('./database')();
	var passport = require('passport');
	var LocalStrategy = require('passport-local').Strategy;
	var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
	var FacebookStrategy = require('passport-facebook').Strategy;
	var GitHubStrategy = require('passport-github2').Strategy;
	var api_key = require('./api_key.json');
	var bcrypt = require('bcrypt');
	
	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser(function (user, done) {
		done(null, user.authId);
	});
	passport.deserializeUser(function (id, done) {
		var sql = 'SELECT * FROM users WHERE authId=?';
		conn.query(sql, [id], function (err, results) {
			if (err) {
				done(err);
			} else {
				done(null, results[0]);
			}
		})
	});

	//local login
	passport.use(new LocalStrategy({
		usernameField: 'email'
	},
		function (email, password, done) {
			var authId = 'local:' + email;
			var pwd = password;
			var sql = 'SELECT * FROM users WHERE authId=?';
			console.log('1');
			conn.query(sql, [authId], function (err, results) {
				if (err) {
					return done(err);
				}
				console.log("2");
				var user = results[0];
				if (user) {
					var hash = user.hash;
					bcrypt.compare(pwd, hash, function (err, res) {
						if (res) {
							return done(null, user);
						} else {
							return done(null, false, { message: 'Incorrect password' });
						}
					});
				} else {
					return done(null, false, { message: 'Incorrect username' });
				}
			})
		}
	));

	//google login
	passport.use(new GoogleStrategy({
		clientID: api_key.google.client_id,
		clientSecret: api_key.google.secret_id,
		callbackURL: api_key.google.callback_url
	},
		function (accessToken, refreshToken, profile, done) {
			process.nextTick(function () {
				if (!profile) {
					return done(null, false);
				}

				var authId = 'google:' + profile.id;

				var userInfo = {
					authId: authId,
					displayName: profile.displayName,
					email: profile.emails[0].value
				};
				var sql = 'SELECT authId FROM users WHERE authId=?';
				conn.query(sql, [authId], function (err, results) {
					if (err) {
						return done(err);
					} else {
						var result = results[0];
						if (result) {
							return done(null, userInfo);
						} else {
							var sql = 'INSERT INTO users SET ?';
							conn.query(sql, userInfo, function (err, results) {
								if (err) {
									return done(err);
								} else {
									return done(null, userInfo);
								}
							})
						}
					}
				})
			});
		}
	));

	//facebook login
	passport.use(new FacebookStrategy({
		clientID: api_key.facebook.client_id,
		clientSecret: api_key.facebook.secret_id,
		callbackURL: api_key.facebook.callback_url
	},
		function (accessToken, refreshToken, profile, done) {
			if (!profile) {
				return done(null, false);
			}

			var authId = 'facebook:' + profile.id;

			var userInfo = {
				authId: authId,
				displayName: profile.displayName,
				email: profile.email
			};

			var sql = 'SELECT authId FROM users WHERE authId=?';
			conn.query(sql, [authId], function (err, results) {
				if (err) {
					return done(err);
				} else {
					var result = results[0];
					if (result) {
						return done(null, userInfo);
					} else {
						var sql = 'INSERT INTO users SET ?';
						conn.query(sql, userInfo, function (err, results) {
							if (err) {
								return done(err);
							} else {
								return done(null, userInfo);
							}
						})
					}
				}
			})
		}
	));

	//github login
	passport.use(new GitHubStrategy({
		clientID: api_key.github.client_id,
		clientSecret: api_key.github.secret_id,
		callbackURL: api_key.github.callback_url
	},
		function (accessToken, refreshToken, profile, done) {
			if (!profile) {
				return done(null, false);
			}

			var authId = 'github:' + profile.id;

			var userInfo = {
				authId: authId,
				displayName: profile.displayName,
				email: profile.emails[0].value
			};

			var sql = 'SELECT authId FROM users WHERE authId=?';
			conn.query(sql, [authId], function (err, results) {
				if (err) {
					return done(err);
				} else {
					var result = results[0];
					if (result) {
						return done(null, userInfo);
					} else {
						var sql = 'INSERT INTO users SET ?';
						conn.query(sql, userInfo, function (err, results) {
							if (err) {
								return done(err);
							} else {
								return done(null, userInfo);
							}
						})
					}
				}
			})
		}
	));

	return passport;
}

