const chalk = require('chalk');
const { DateTime } = require('luxon');
const { Database } = require('bun:sqlite');
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

			const getSettings = db_settings.prepare('SELECT * FROM settings WHERE guild_id = ?').get(Bun.env.SERVER_ID);

			if (!buttonID) return;

			if (buttonID == 'toggleThreeDayForecast') {
				const newShowForecast = getSettings ? (getSettings.showForecast ? 0 : 1) : 1;

				db_settings.prepare('UPDATE settings SET showForecast = ? WHERE guild_id = ?').run(newShowForecast, Bun.env.SERVER_ID);

				interaction.deferUpdate();
			}

			if (buttonID == 'toggleAPIData') {
				const newShowAPIData = getSettings ? (getSettings.showAPIData ? 0 : 1) : 1;

				db_settings.prepare('UPDATE settings SET showAPIData = ? WHERE guild_id = ?').run(newShowAPIData, Bun.env.SERVER_ID);

				interaction.deferUpdate();
			}

			if (buttonID == 'toggleAlerts') {
				const newAlerts = getSettings ? (getSettings.alerts ? 0 : 1) : 1;

				db_settings.prepare('UPDATE settings SET alerts = ? WHERE guild_id = ?').run(newAlerts, Bun.env.SERVER_ID);

				interaction.deferUpdate();
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

			db_settings.prepare('UPDATE settings SET location = ?, units = ? WHERE guild_id = ?').run(location[0], units[0], Bun.env.SERVER_ID);

			interaction.deferUpdate();
		}
	},
};
