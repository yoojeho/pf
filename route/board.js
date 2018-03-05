module.exports = function () {
	var conn = require('../config/database')();
	var route = require('express').Router();

	//글목록
	route.get('/post/:post_page', function (req, res) {
		var user = req.user;
		var page = req.params.post_page;
		var sql = 'SELECT * FROM posts';
		conn.query(sql, function (err, results) {
			var posts = results;
			if (user) {
				var authId = user.authId;
				var email = user.email;
				var sql = 'SELECT * FROM users WHERE authId=?';
				conn.query(sql, [authId], function (err, results) {
					var profilePicture = results[0].profilePicture;
					var pP = '../../images/userprofile/' + email + '/profilePicture/' + profilePicture;
					console.log('pP: ' + pP);
					res.render('board', {
						user: user,
						pP: pP,
						page: page,
						posts: posts
					});
				})
			} else {
				res.render('board', {
					page: page,
					posts: posts
				});
			}
		})
	});

	//글내용
	route.get('/content/:post_num/:comment_page', function (req, res) {
		var post_num = req.params.post_num;
		var page = req.params.comment_page;
		var sql = 'SELECT * FROM posts WHERE post_number=?'
		conn.query(sql, [post_num], function (err, results) {
			var posts = results[0];
			if (posts) {
				var author = posts.authId;
				var user = req.user;
				var sql = 'SELECT * FROM comments WHERE post_number=?'
				conn.query(sql, [post_num], function (err, results) {
					var comments = results[0];
					if (user) {
						var authId = user.authId;
						var email = user.email;
						var sql = 'SELECT * FROM users WHERE authId=?';
						conn.query(sql, [authId], function (err, results) {
							var profilePicture = results[0].profilePicture;
							var pP = '../../../images/userprofile/' + email + '/profilePicture/' + profilePicture;
							console.log('pP: ' + pP);
							res.render('content', {
								user: user,
								pP: pP,
								page: page,
								posts: posts,
								comments: comments,
								author: author,
								authId: authId
							});
						})
					} else {
						res.render('content', {
							page: page,
							posts: posts,
							comments: comments,
							author: author,
							authId: authId
						});
					}	
				})
			} else {
				res.redirect('/board/post/1');
			}
		})
	});

	//글쓰기
	route.post('/write', function (req, res) {
		var title = req.body.title;
		var content = req.body.content;
		var dpName = req.user.displayName;
		var authId = req.user.authId;

		var doc = {
			title: title,
			content: content,
			displayName: dpName,
			authId: authId
		};
		var sql = 'INSERT INTO posts SET ?';
		conn.query(sql, doc, function (err, results) {
			if (err) {
				console.log(err);
			} else {
				res.redirect('/board/post/1');
			}
		})
	});

	route.get('/write', function (req, res) {
		var user = req.user;
		if(user){
			var authId = user.authId;
			var email = user.email;
			var sql = 'SELECT * FROM users WHERE authId=?';
			conn.query(sql, [authId], function (err, results) {
				var profilePicture = results[0].profilePicture;
				var pP = '../../images/userprofile/' + email + '/profilePicture/' + profilePicture;
				console.log('pP: ' + pP);
				res.render('post_write', {
					user: user,
					pP: pP
				});
			})
		} else {
			res.redirect('/board/post/1');
		}
	});
	

	route.get('/delete/post/:post_num', function (req, res) {
		res.send('post_delete');
	});

	route.get('/delete/comment/:post_num/:comment_num', function (req, res) {

	});

	return route;
}