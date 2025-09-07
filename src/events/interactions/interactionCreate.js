const chalk = require('chalk');
const Database = require('better-sqlite3');
const { MessageFlags, InteractionType } = require('discord.js');

const db_settings = new Database(`${__dirname}/../../database/settings.sqlite`);

module.exports = {
	name: 'interactionCreate',
	once: false,
	async execute(interaction, client) {
		if (interaction.type === InteractionType.ApplicationCommand) {
			const command = client.commands.get(interaction.commandName);

			if (!command) return;

			try {
				await command.execute(interaction);
				console.log(chalk.blue(`${chalk.bold('[COMMAND]')} ${interaction.user.username} used /${interaction.commandName}`));
			} catch (error) {
				console.log(chalk.red(`${chalk.bold('[COMMAND]')} ${error}`));
			}
		}

		if (interaction.isButton()) {
			const buttonID = interaction.customId;

			if (!buttonID) return;

			if (buttonID == 'toggleThreeDayForecast') {
				// toggle showForecast in db
				const showForecastRow = db_settings.prepare('SELECT showForecast FROM settings WHERE guild_id = ?').get(process.env.SERVER_ID);

				const newShowForecast = showForecastRow ? (showForecastRow.showForecast ? 0 : 1) : 1;

				db_settings.prepare('INSERT OR REPLACE INTO settings (guild_id, showForecast) VALUES (?, ?)').run(process.env.SERVER_ID, newShowForecast);

				interaction.reply({ content: '3 Day Forecast Button Clicked', ephemeral: true, flags: MessageFlags.Ephemeral });
			}

			try {
				console.log(chalk.blue(`${chalk.bold('[BUTTON]')} ${interaction.user.username} clicked ${buttonID}`));
			} catch (error) {
				console.log(chalk.red(`${chalk.bold('[BUTTON]')} ${error}`));
			}
		}
	},
};
