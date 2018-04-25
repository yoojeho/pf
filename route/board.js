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
	route.get('/post', (req, res) => {
		const { user } = req;
		const { page } = req.query;
		const { category } = req.query;
		const { title_content } = req.query;
		const { title } = req.query;
		const { content } = req.query;
		let value;
		let page_opt;
		let whereLike;
		let post_sql;

		let sql = 'SELECT * FROM posts';
		if (category) {
			sql = 'SELECT * FROM posts WHERE category=?';
			value = category;
			page_opt = '&category=' + category;
		}

		if (title_content) {
			whereLike = 'title LIKE \'%' + title_content + '%\' or content LIKE \'%' + title_content + '%\'';
		}
		if (title) {
			whereLike = 'title LIKE \'%' + title + '%\'';
		}
		if (content) {
			whereLike = 'content LIKE \'%' + content + '%\'';
		}

		if (whereLike) {
			post_sql = sql + ' and ' + whereLike;
			if (!category) post_sql = sql + ' where ' + whereLike;
		}	else {
			post_sql = sql;
		}

		conn.query(post_sql, value, (err, results) => {
			const posts = results;
			if (user) {
				const { authId } = user;
				const { email } = user;
				const sql = 'SELECT * FROM users WHERE authId=?';
				conn.query(sql, [authId], (err, results) => {
					const { profilePicture } = results[0];
					const pP = '/images/userprofile/' + email + '/profilePicture/' + profilePicture;
					res.render('board', {
						user,
						pP,
						page,
						page_opt,
						category,
						posts,
					});
				});
			} else {
				res.render('board', {
					page,
					page_opt,
					posts,
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
			const post = results[0];
			if (post) {
				const content = post.content.split('');
				const author = post.authId;
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
								user,
								pP,
								page,
								post,
								content,
								comments,
								author,
								authId,
							});
						});
					} else {
						res.render('content', {
							page,
							post,
							content,
							comments,
							author,
						});
					}
				});
			} else {
				res.redirect('/board/post?page=1');
			}
		});
	});

	// 글쓰기
	route.post('/write', (req, res) => {
		const { title } = req.body;
		const { content } = req.body;
		const { authId } = req.user;
		const dpName = req.user.displayName;
		const { category } = req.body;
		const doc = {
			title,
			content,
			displayName: dpName,
			authId,
			category,
		};

		if (category === '') return res.send('category_null');
		if (title === '') return res.send('title_null');
		if (!authId) return res.send('user_null');
		const sql = 'INSERT INTO posts SET ?';
		return conn.query(sql, doc, (err) => {
			if (err) {
				console.log(err);
				return res.send('err');
			}
			return res.send('success');
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
			res.redirect('/board/post?page=1');
		}
	});

	// 글수정
	route.post('/edit/post', (req, res) => {
		const { title } = req.body;
		const { post_num } = req.body;
		const { content } = req.body;
		const { authId } = req.user;
		const { category } = req.body;

		if (category === '') return res.send('category_null');
		if (title === '') return res.send('title_null');
		if (!authId) return res.send('user_null');
		const sql = 'UPDATE posts set title=?, content=?, category=? WHERE authId=? AND post_number=?';
		return conn.query(sql, [title, content, category, authId, post_num], (err) => {
			if (err) {
				console.log(err);
				return res.send('err');
			}
			return res.send('success');
		});
	});

	route.get('/edit/post/:post_num', (req, res) => {
		if (req.user) {
			const { post_num } = req.params;
			const user_authId = req.user.authId;
			const sql = 'SELECT * FROM posts WHERE post_number=?';
			conn.query(sql, [post_num], (err, results) => {
				if (err) {
					console.log(err);
				}	else {
					const post = results[0];
					const post_authId = post.authId;
					if (post_authId === user_authId) {
						res.render('post_edit', {
							post,
						});
					}
				}
			});
		} else {
			res.redirect('/board/post?page=1');
		}
	});

	// 글삭제
	route.get('/delete/post/:post_num', (req, res) => {
		if (req.user) {
			const { post_num } = req.params;
			const user_authId = req.user.authId;
			const sql = 'SELECT * FROM posts WHERE post_number=?';
			conn.query(sql, [post_num], (err, results) => {
				const post_authId = results[0].authId;
				if (post_authId === user_authId) {
					const sql = 'DELETE FROM posts WHERE post_number=? AND authId=?';
					conn.query(sql, [post_num, user_authId], (err) => {
						if (err) {
							console.log(err);
						} else {
							res.redirect('/board/post?page=1');
						}
					});
				} else {
					res.send('fail');
				}
			});
		} else {
			res.redirect('/board/post?page=1');
		}
	});

	// route.get('/delete/comment/:post_num/:comment_num', (req, res) => {

	// });

	return route;
};
