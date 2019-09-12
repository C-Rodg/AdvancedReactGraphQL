const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// Parse cookies
server.express.use(cookieParser());
// decode the JWT to get userId
server.express.use((req, res, next) => {
	const { token } = req.cookies;
	if (token) {
		const { userId } = jwt.verify(token, process.env.APP_SECRET);
		// put the userId onto request
		req.userId = userId;
	}
	next();
});

// Create a middleware that populates the user on each request
server.express.use(async (req, res, next) => {
	// if not logged in, skip
	if (!req.userId) {
		return next();
	}
	const user = await db.query.user(
		{ where: { id: req.userId } },
		`{ id, permissions, email, name}`
	);
	req.user = user;
	next();
});

server.start(
	{
		cors: {
			credentials: true,
			origin: process.env.FRONTEND_URL
		}
	},
	obj => {
		console.log(`Server is now running on port ${obj.port}`);
	}
);
