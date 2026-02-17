const chalk = require('chalk');
const { SQL } = require('bun');

const dbConnection = new SQL({
	adapter: 'postgres',
	hostname: Bun.env.DB_HOST,
	port: Bun.env.DB_PORT,
	database: Bun.env.DB_NAME,
	username: Bun.env.DB_USER,
	password: Bun.env.DB_PASS,

	onconnect: () => {
		console.log(`${chalk.green.bold('[SENTRY]')} Database Connection Successful`);
	},
	onclose: (client, err) => {
		if (err) {
			console.error(`${chalk.red.bold('[SENTRY]')} Database Connection Closed with Error:`, err);
		}

		console.log(`${chalk.yellow.bold('[SENTRY]')} Database Connection Closed`);
	},
});

module.exports = dbConnection;
