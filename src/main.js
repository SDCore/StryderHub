const chalk = require('chalk');
const dbConnection = require('./database.js');
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

async function defaultDBValues() {
	await dbConnection`UPDATE hub_settings SET showforecast = 1, showforecast_update = 1, showbotdata = 1, showbotdata_update = 1, location = 'home', location_update = 'home', units = 'us', units_update = 'us', alerts = 1, alerts_update = 1, update_type = 'None', last_updated = 0 WHERE guild_id = ${Bun.env.SERVER_ID}`;
}

defaultDBValues();

module.exports = { client };
