const conn = require('../config/database')();
const route = require('express').Router();

module.exports = () => {
	// 유저체크
	route.post('/usercheck', (req, res) => {
		const { user } = req;
		if (user) {
			res.send('true');
		} else {
			res.send('false');
		}
	});

	// 글목록
	route.get('/post/:post_page', (req, res) => {
		const { user } = req;
		const page = req.params.post_page;
		const sql = 'SELECT * FROM posts';
		conn.query(sql, (err, results) => {
			const posts = results;
			if (user) {
				const { authId } = user;
				const { email } = user;
				const sql = 'SELECT * FROM users WHERE authId=?';
				conn.query(sql, [authId], (err, results) => {
					const { profilePicture } = results[0];
					const pP = '/images/userprofile/' + email + '/profilePicture/' + profilePicture;
					res.render('board', {
						user: user,
						pP: pP,
						page: page,
						posts: posts,
					});
				});
			} else {
				res.render('board', {
					page: page,
					posts: posts,
				});
			}
		});
	});

	// 글내용
	route.get('/content/:post_num/:comment_page', (req, res) => {
		const { post_num } = req.params;
		const page = req.params.comment_page;
		const sql = 'SELECT * FROM posts WHERE post_number=?';
		conn.query(sql, [post_num], (err, results) => {
			const posts = results[0];
			if (posts) {
				const author = posts.authId;
				const { user } = req;
				const sql = 'SELECT * FROM comments WHERE post_number=?';
				conn.query(sql, [post_num], (err, results) => {
					const comments = results[0];
					if (user) {
						const { authId } = user;
						const { email } = user;
						const sql = 'SELECT * FROM users WHERE authId=?';
						conn.query(sql, [authId], (err, results) => {
							const { profilePicture } = results[0];
							const pP = '/images/userprofile/' + email + '/profilePicture/' + profilePicture;
							res.render('content', {
								user: user,
								pP: pP,
								page: page,
								posts: posts,
								comments: comments,
								author: author,
								authId: authId,
							});
						});
					} else {
						res.render('content', {
							page: page,
							posts: posts,
							comments: comments,
							author: author,
						});
					}
				});
			} else {
				res.redirect('/board/post/1');
			}
		});
	});

	// 글쓰기
	route.post('/write', (req, res) => {
		const { title } = req.body;
		const { content } = req.body;
		const { authId } = req.user;
		const dpName = req.user.displayName;

		const doc = {
			title: title,
			content: content,
			displayName: dpName,
			authId: authId,
		};
		const sql = 'INSERT INTO posts SET ?';
		conn.query(sql, doc, (err) => {
			if (err) {
				console.log(err);
			} else {
				res.redirect('/board/post/1');
			}
		});
	});

	route.get('/write', (req, res) => {
		const { user } = req;
		if (user) {
			const { authId } = user;
			const { email } = user;
			const sql = 'SELECT * FROM users WHERE authId=?';
			conn.query(sql, [authId], (err, results) => {
				const { profilePicture } = results[0];
				const pP = '/images/userprofile/' + email + '/profilePicture/' + profilePicture;
				res.render('post_write', {
					user: user,
					pP: pP,
				});
			});
		} else {
			res.redirect('/board/post/1');
		}
	});

	// 글삭제
	route.delete('/delete/post/:post_num', (req, res) => {
		const post_number = req.params.post_num;
		const user_authId = req.user.authId;
		const sql = 'SELECT * FROM posts WHERE post_number=?';
		conn.query(sql, [post_number], (err, results) => {
			const post_authId = results[0].authId;
			if (post_authId === user_authId) {
				const sql = 'DELETE FROM posts WHERE post_number=? AND authId=?';
				conn.query(sql, [post_number, user_authId], (err) => {
					if (err) {
						console.log(err);
					} else {
						res.redirect('/board/post/1');
					}
				});
			} else {
				res.send('fail');
			}
		});
	});

	// route.get('/delete/comment/:post_num/:comment_num', (req, res) => {

	// });

	return route;
};
