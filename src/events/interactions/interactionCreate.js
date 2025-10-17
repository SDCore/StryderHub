const chalk = require('chalk');
const Database = require('better-sqlite3');
const { ModalBuilder, MessageFlags, LabelBuilder, InteractionType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

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

				db_settings.prepare('UPDATE settings SET showForecast = ? WHERE guild_id = ?').run(newShowForecast, process.env.SERVER_ID);

				interaction.reply({ content: 'Toggled 3-Day Forecast', flags: MessageFlags.Ephemeral });
			}

			if (buttonID == 'toggleAPIData') {
				// toggle showAPIData in db
				const showAPIDataRow = db_settings.prepare('SELECT showAPIData FROM settings WHERE guild_id = ?').get(process.env.SERVER_ID);

				const newShowAPIData = showAPIDataRow ? (showAPIDataRow.showAPIData ? 0 : 1) : 1;

				db_settings.prepare('UPDATE settings SET showAPIData = ? WHERE guild_id = ?').run(newShowAPIData, process.env.SERVER_ID);

				interaction.reply({ content: 'Toggled API Data', flags: MessageFlags.Ephemeral });
			}

			if (buttonID == 'settings') {
				const settingsModal = new ModalBuilder().setCustomId('settingsModal').setTitle('Stryder Hub Settings');

				const locationSelect = new LabelBuilder()
					.setLabel('Location')
					.setDescription('Location for Weather Data')
					.setStringSelectMenuComponent(
						new StringSelectMenuBuilder()
							.setCustomId('locationSelect')
							.setPlaceholder('Select a location')
							.addOptions(
								new StringSelectMenuOptionBuilder().setLabel('Home').setValue('home').setDescription('Mundelein, IL').setDefault(true),
								new StringSelectMenuOptionBuilder().setLabel('Chicago').setValue('chicago').setDescription('Chicago, IL'),
								new StringSelectMenuOptionBuilder().setLabel('New York').setValue('new_york').setDescription('New York, NY'),
							)
							.setMinValues(1)
							.setMaxValues(1),
					);

				settingsModal.addLabelComponents(locationSelect);

				await interaction.showModal(settingsModal);
			}

			try {
				console.log(chalk.blue(`${chalk.bold('[BUTTON]')} ${interaction.user.username} clicked ${buttonID}`));
			} catch (error) {
				console.log(chalk.red(`${chalk.bold('[BUTTON]')} ${error}`));
			}
		}
	},
};
