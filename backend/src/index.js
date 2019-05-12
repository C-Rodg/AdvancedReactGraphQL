require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// TODO: cookies via JWT
// TODO: populate user

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
