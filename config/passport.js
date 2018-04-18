const conn = require('./database')();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const api_key = require('./api_key.json');
const bcrypt = require('bcrypt');

module.exports = (app) => {
	app.use(passport.initialize());
	app.use(passport.session());

	passport.serializeUser((user, done) => {
		done(null, user.authId);
	});
	passport.deserializeUser((id, done) => {
		const sql = 'SELECT * FROM users WHERE authId=?';
		conn.query(sql, [id], (err, results) => {
			if (err) {
				done(err);
			} else {
				done(null, results[0]);
			}
		});
	});

	// local login
	passport.use(new LocalStrategy(
		{
			usernameField: 'email',
		},
		((email, password, done) => {
			const authId = `local:${email}`;
			const pwd = password;
			const sql = 'SELECT * FROM users WHERE authId=?';
			conn.query(sql, [authId], (err, results) => {
				if (err) {
					return done(err);
				}
				const user = results[0];
				if (user) {
					const user_hash = user.hash;
					return bcrypt.compare(pwd, user_hash, (err, res) => {
						if (res) {
							return done(null, user);
						}
						return done(null, false, {
							message: 'Incorrect password',
						});
					});
				}
				return done(null, false, {
					message: 'Incorrect username',
				});
			});
		}),
	));

	// google login
	passport.use(new GoogleStrategy(
		{
			clientID: api_key.google.client_id,
			clientSecret: api_key.google.secret_id,
			callbackURL: api_key.google.callback_url,
		},
		((accessToken, refreshToken, profile, done) => {
			process.nextTick(() => {
				if (!profile) {
					return done(null, false);
				}

				const authId = `google:${profile.id}`;

				const userInfo = {
					authId,
					displayName: profile.displayName,
					email: profile.emails[0].value,
				};
				const sql = 'SELECT authId FROM users WHERE authId=?';
				return conn.query(sql, [authId], (err, results) => {
					if (err) {
						return done(err);
					}
					const result = results[0];
					if (result) {
						return done(null, userInfo);
					}
					const sql = 'INSERT INTO users SET ?';
					return conn.query(sql, userInfo, (err) => {
						if (err) {
							return done(err);
						}
						return done(null, userInfo);
					});
				});
			});
		}),
	));

	// facebook login
	passport.use(new FacebookStrategy(
		{
			clientID: api_key.facebook.client_id,
			clientSecret: api_key.facebook.secret_id,
			callbackURL: api_key.facebook.callback_url,
		},
		((accessToken, refreshToken, profile, done) => {
			if (!profile) {
				return done(null, false);
			}

			const authId = `facebook:${profile.id}`;

			const userInfo = {
				authId,
				displayName: profile.displayName,
				email: profile.email,
			};

			const sql = 'SELECT authId FROM users WHERE authId=?';
			return conn.query(sql, [authId], (err, results) => {
				if (err) {
					return done(err);
				}
				const result = results[0];
				if (result) {
					return done(null, userInfo);
				}
				const sql = 'INSERT INTO users SET ?';
				return conn.query(sql, userInfo, (err) => {
					if (err) {
						return done(err);
					}
					return done(null, userInfo);
				});
			});
		}),
	));

	// github login
	passport.use(new GitHubStrategy(
		{
			clientID: api_key.github.client_id,
			clientSecret: api_key.github.secret_id,
			callbackURL: api_key.github.callback_url,
		},
		((accessToken, refreshToken, profile, done) => {
			if (!profile) {
				return done(null, false);
			}

			const authId = `github:${profile.id}`;

			const userInfo = {
				authId,
				displayName: profile.displayName,
				email: profile.emails[0].value,
			};

			const sql = 'SELECT authId FROM users WHERE authId=?';
			return conn.query(sql, [authId], (err, results) => {
				if (err) {
					return done(err);
				}
				const result = results[0];
				if (result) {
					return done(null, userInfo);
				}
				const sql = 'INSERT INTO users SET ?';
				return conn.query(sql, userInfo, (err) => {
					if (err) {
						return done(err);
					}
					return done(null, userInfo);
				});
			});
		}),
	));

	return passport;
};
