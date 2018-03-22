module.exports = function () {
	var route = require('express').Router();
	var conn = require('../config/database')();

	route.get('/', function (req, res) {
		var user = req.user;
		if (user) {
			var authId = user.authId;
			var email = user.email;
			var sql = 'SELECT * FROM users WHERE authId=?';
			conn.query(sql, [authId], function (err, results) {
				var profilePicture = results[0].profilePicture;
				var pP = 'images/userprofile/' + email + '/profilePicture/' + profilePicture;
				console.log('pP: '+pP);
				res.render('about_me', {
					user: user,
					pP: pP
				});
			})
		} else {
			res.render('about_me');
		}

		
	});

	return route;
}