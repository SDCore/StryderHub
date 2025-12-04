const chalk = require('chalk');
const { Database } = require('bun:sqlite');
const { Client, GatewayIntentBits } = require('discord.js');
const { Guilds, GuildMembers, GuildMessages, GuildPresences } = GatewayIntentBits;

Bun.env.TZ = 'America/Chicago';

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
	.login(Bun.env.DISCORD_TOKEN)
	.then(() => {
		loadEvents(client);
	})
	.catch(err => console.log(err));

const db_settings = new Database(`${__dirname}/database/settings.sqlite`, { create: true });

db_settings.prepare('DROP TABLE IF EXISTS settings').run();

db_settings
	.prepare(
		'CREATE TABLE IF NOT EXISTS settings (guild_id TEXT, showForecast BOOL, showForecastUpdate BOOL, showAPIData BOOL, showAPIDataUpdate BOOL, location TEXT, locationUpdate TEXT, units TEXT, unitsUpdate TEXT, alerts BOOL, alertsUpdate BOOL, updateType TEXT, lastUpdated TEXT, PRIMARY KEY(guild_id))',
	)
	.run();

db_settings
	.prepare(
		'INSERT OR IGNORE INTO settings (guild_id, showForecast, showForecastUpdate, showAPIData, showAPIDataUpdate, location, locationUpdate, units, unitsUpdate, alerts, alertsUpdate, updateType, lastUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
	)
	.run(Bun.env.SERVER_ID, 1, 1, 1, 1, 'home', 'home', 'us', 'us', 1, 1, 'None', 0);

module.exports = { client };
