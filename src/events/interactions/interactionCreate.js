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
				const showForecastRow = db_settings.prepare('SELECT showForecast FROM settings WHERE guild_id = ?').get(process.env.SERVER_ID);

				const newShowForecast = showForecastRow ? (showForecastRow.showForecast ? 0 : 1) : 1;

				db_settings.prepare('UPDATE settings SET showForecast = ? WHERE guild_id = ?').run(newShowForecast, process.env.SERVER_ID);

				interaction.reply({ content: 'Toggled 3-Day Forecast', flags: MessageFlags.Ephemeral });
			}

			if (buttonID == 'toggleAPIData') {
				const showAPIDataRow = db_settings.prepare('SELECT showAPIData FROM settings WHERE guild_id = ?').get(process.env.SERVER_ID);

				const newShowAPIData = showAPIDataRow ? (showAPIDataRow.showAPIData ? 0 : 1) : 1;

				db_settings.prepare('UPDATE settings SET showAPIData = ? WHERE guild_id = ?').run(newShowAPIData, process.env.SERVER_ID);

				interaction.reply({ content: 'Toggled API Data', flags: MessageFlags.Ephemeral });
			}

			if (buttonID == 'settings') {
				const settingsModal = new ModalBuilder().setCustomId('settingsModal').setTitle('Stryder Hub Settings');

				const locationSelect = new LabelBuilder()
					.setLabel('Location')
					.setStringSelectMenuComponent(
						new StringSelectMenuBuilder()
							.setCustomId('locationSelect')
							.setPlaceholder('Select a location')
							.addOptions(
								new StringSelectMenuOptionBuilder().setLabel('Home').setValue('home').setDescription('Mundelein, IL').setDefault(true),
								new StringSelectMenuOptionBuilder().setLabel('Chicago').setValue('chicago').setDescription('Chicago, IL'),
								new StringSelectMenuOptionBuilder().setLabel('Pittsburgh').setValue('pittsburgh').setDescription('Pittsburgh, PA'),
								new StringSelectMenuOptionBuilder().setLabel('New York').setValue('new_york').setDescription('New York, NY'),
							)
							.setMinValues(1)
							.setMaxValues(1),
					);

				const unitSelect = new LabelBuilder()
					.setLabel('Units')
					.setStringSelectMenuComponent(
						new StringSelectMenuBuilder()
							.setCustomId('unitSelect')
							.setPlaceholder('Select units')
							.addOptions(
								new StringSelectMenuOptionBuilder().setLabel('US').setValue('us').setDescription('Temperature: Fahrenheit, Wind: mph').setDefault(true),
								new StringSelectMenuOptionBuilder().setLabel('Canada').setValue('ca').setDescription('Temperature: Celsius, Wind: kph'),
								new StringSelectMenuOptionBuilder().setLabel('UK').setValue('uk').setDescription('Temperature: Celsius, Wind: mph'),
							)
							.setMinValues(1)
							.setMaxValues(1),
					);

				settingsModal.addLabelComponents(locationSelect);
				settingsModal.addLabelComponents(unitSelect);

				await interaction.showModal(settingsModal);
			}

			try {
				console.log(chalk.blue(`${chalk.bold('[BUTTON]')} ${interaction.user.username} clicked ${buttonID}`));
			} catch (error) {
				console.log(chalk.red(`${chalk.bold('[BUTTON]')} ${error}`));
			}
		}

		if (interaction.customId == 'settingsModal') {
			const location = interaction.fields.getStringSelectValues('locationSelect');
			const units = interaction.fields.getStringSelectValues('unitSelect');

			db_settings.prepare('UPDATE settings SET location = ?, units = ? WHERE guild_id = ?').run(location[0], units[0], process.env.SERVER_ID);

			interaction.reply({ content: `Updated location to ${location} and units to ${units}!`, flags: MessageFlags.Ephemeral });
		}
	},
};
