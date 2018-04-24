const app = require('./config/express')();
const passport = require('./config/passport')(app);
const server_info = require('./config/api_key.json');
const path = require('path');
const os = require('os');
const lex = require('greenlock-express').create({
	version: 'draft-11',
	server: 'https://acme-v02.api.letsencrypt.org/directory',
	email: server_info.lex.email,
	agreeTos: true,
	approveDomains: server_info.lex.domains,
	configDir: path.join(os.homedir(), 'acme', 'etc'),
	app: app,
});

const server = lex.listen(80, 443);
const io = require('socket.io')(server);
const socketEvents = require('./config/socket');

const auth = require('./route/auth')(passport);

app.use('/auth', auth);

const index = require('./route/index')();

app.use('/index', index);

const board = require('./route/board')();

app.use('/board', board);

app.get('/', (req, res) => {
	res.redirect('/index');
});

socketEvents(io);
