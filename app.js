const app = require('./config/express')();
const passport = require('./config/passport')(app);
const http = require('http').Server(app);
const io = require('socket.io')(http);

const userList = [];
let count = 1;
let users = '';

io.on('connection', (socket) => {
	console.log('user connected: ', socket.id);

	let socketname = socket.name;
	// 접속한 클라이언트의 정보가 수신되면
	socket.on('login', (name) => {
		let dpName = '';
		if (name) {
			dpName = name;
		} else {
			dpName = `user ${count++}`;
		}
		socketname = dpName;

		userList.push(dpName);
		users = '';
		for (let i = 0; i < userList.length; i++) {
			users += `${userList[i]}\n`;
		}
		// 메세지를 전송한 클라이언트에게만 전송
		socket.emit('change name', dpName);

		// 접속한 모든 클라이언트에 전송
		io.emit('login', dpName, users);
	});

	// 접속종료
	socket.on('disconnect', () => {
		userList.splice(userList.indexOf(socketname), 1);
		users = '';
		for (let i = 0; i < userList.length; i++) {
			users += `${userList[i]}\n`;
		}
		io.emit('logout', socketname, users);
		console.log('user disconnected: ', socket.id);
	});

	// 강제종료
	socket.on('forceDisconnect', () => {
		socket.disconnect();
	});

	// 클라이언트로부터 메세지가 수신되면
	socket.on('send message', (name, text) => {
		const msg = `${name} : ${text}`;
		console.log(`msg: [ ${msg} ]`);
		// 메세지를 전송한 클라이언트를 제외한 모든 클라이언트에 메시지 전송
		socket.broadcast.emit('receive message', msg);
	});
});

const auth = require('./route/auth')(passport);

app.use('/auth', auth);

const index = require('./route/index')();

app.use('/index', index);

const board = require('./route/board')();

app.use('/board', board);

app.get('/', (req, res) => {
	// const user = req.user;
	// console.log('appget', JSON.stringify(user), req.user);
	res.redirect('/index');
});

http.listen(80, () => {
	console.log('Connected 80 port!!');
});
