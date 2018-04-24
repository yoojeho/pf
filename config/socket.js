const userList = [];
let count = 1;
let users = '';

module.exports = (io) => {
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
			// 메세지를 전송한 클라이언트를 제외한 모든 클라이언트에 메시지 전송
			socket.broadcast.emit('receive message', msg);
		});
	});
	return io;
};
