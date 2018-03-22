var app = require('./config/express')();
var passport = require('./config/passport')(app);

var auth = require('./route/auth')(passport);
app.use('/auth', auth);

var index = require('./route/index')();
app.use('/index', index);

var board = require('./route/board')();
app.use('/board', board);

app.get('/', function (req, res) {
	// var user = req.user;
	// console.log('appget', JSON.stringify(user), req.user);
	res.redirect('/index');
});

app.listen(80, function () {
	console.log('test Connected 80 port!!');
});
