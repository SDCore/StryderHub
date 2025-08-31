const fs = require('fs');
const chalk = require('chalk');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Collection, ActivityType } = require('discord.js');

module.exports = {
	name: 'clientReady',
	once: true,
	execute(client) {
		console.log(chalk.green(`${chalk.bold('[BOT]')} ${client.user.username} is Online.`));

		(async function presenceLoop() {
			const currentMinute = new Date().getMinutes();
			const currentDay = new Date().getDate();
			const currentMonth = new Date().getMonth() + 1;
			const currentYear = new Date().getFullYear();

			if (currentMinute % 10 == 0) {
				client.user.setPresence({
					activities: [
						{
							type: ActivityType.Custom,
							name: `Stryder Data Tunnel · ${currentMonth}/${currentDay}/${currentYear}`,
						},
					],
				});
			}

			var delay = 60000 - new Date().getSeconds() * 1000;
			setTimeout(presenceLoop, delay);
		})();

		// Register slash commands
		const commands = [];
		const clientID = client.user.id;
		const rest = new REST({ version: 10 }).setToken(process.env.DISCORD_TOKEN);
		const folders = fs.readdirSync(`${__dirname}/../../commands`);

		client.commands = new Collection();

		for (const folder of folders) {
			const files = fs.readdirSync(`${__dirname}/../../commands/${folder}`).filter(file => file.endsWith('.js'));

			for (const file of files) {
				const command = require(`../../commands/${folder}/${file}`);

				commands.push(command.data.toJSON());
				client.commands.set(command.data.name, command);
			}
		}

		// Push the commands to Discord
		(async () => {
			if (process.env.DEBUG == 'false') {
				// If debug is disabled, assume production
				// bot and register global slash commands
				await rest.put(Routes.applicationCommands(clientID), { body: commands });

				console.log(chalk.green(`${chalk.bold('[BOT]')} Successfully registered global slash commands`));
			} else {
				// If debug is enabled, assume dev environment
				// and only register slash commands for dev build
				await rest.put(Routes.applicationGuildCommands(clientID, process.env.SERVER_ID), { body: commands });

				console.log(chalk.yellow(`${chalk.bold('[BOT]')} Successfully registered local slash commands`));
			}
		})();
	},
};
