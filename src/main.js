const chalk = require('chalk');
const dotenv = require('dotenv');
// const Database = require('better-sqlite3');
const { Database } = require('bun:sqlite');
const { Client, GatewayIntentBits } = require('discord.js');
const { Guilds, GuildMembers, GuildMessages, GuildPresences } = GatewayIntentBits;

dotenv.config({ quiet: true });

process.env.TZ = 'America/Chicago';

const { loadEvents } = require('./loadEvents.js');

const client = new Client({ intents: [Guilds, GuildMembers, GuildMessages, GuildPresences] });

process.on('unhandledRejection', err => {
	console.log(chalk.red(`${chalk.bold('[BOT]')} Unhandled Rejection: ${err}`));
});

process.on('uncaughtException', err => {
	console.log(chalk.red(`${chalk.bold('[BOT]')} Unhandled Exception: ${err}`));
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
	console.log(chalk.red(`${chalk.bold('[BOT]')} Uncaught Exception Monitor: ${err}, ${origin}`));
});

client
	.login(process.env.DISCORD_TOKEN)
	.then(() => {
		loadEvents(client);
	})
	.catch(err => console.log(err));

// Create DB Files if they don't exist
const db_settings = new Database(`${__dirname}/database/settings.sqlite`);

db_settings.prepare('DROP TABLE IF EXISTS settings').run();
db_settings
	.prepare(
		'CREATE TABLE IF NOT EXISTS settings (guild_id TEXT, showForecast BOOL, showForecastUpdate BOOL, showAPIData BOOL, showAPIDataUpdate BOOL, location TEXT, locationUpdate TEXT, units TEXT, unitsUpdate TEXT, alerts BOOL, alertsUpdate BOOL, PRIMARY KEY(guild_id))',
	)
	.run();

// insert default settings for guild if not present
db_settings
	.prepare(
		'INSERT OR IGNORE INTO settings (guild_id, showForecast, showForecastUpdate, showAPIData, showAPIDataUpdate, location, locationUpdate, units, unitsUpdate, alerts, alertsUpdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
	)
	.run(process.env.SERVER_ID, 1, 1, 1, 1, 'home', 'home', 'us', 'us', 1, 1);

module.exports = { client };
