const chalk = require('chalk');
const dbConnection = require('../../database.js');
const { ModalBuilder, MessageFlags, LabelBuilder, InteractionType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

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

			const getSettings = await dbConnection`SELECT * FROM hub_settings WHERE guild_id = ${Bun.env.SERVER_ID}`.then(res => res[0]);

			if (!buttonID) return;

			if (buttonID == 'toggleThreeDayForecast') {
				const newShowForecast = getSettings ? (getSettings.showforecast ? 0 : 1) : 1;

				await dbConnection`UPDATE hub_settings SET showforecast = ${newShowForecast} WHERE guild_id = ${Bun.env.SERVER_ID}`.then(() => {
					console.log('bread');
				});

				interaction.deferUpdate();
			}

			if (buttonID == 'toggleAPIData') {
				const newShowAPIData = getSettings ? (getSettings.showbotdata ? 0 : 1) : 1;

				await dbConnection`UPDATE hub_settings SET showbotdata = ${newShowAPIData} WHERE guild_id = ${Bun.env.SERVER_ID}`;

				interaction.deferUpdate();
			}

			if (buttonID == 'toggleAlerts') {
				const newAlerts = getSettings ? (getSettings.alerts ? 0 : 1) : 1;

				await dbConnection`UPDATE hub_settings SET alerts = ${newAlerts} WHERE guild_id = ${Bun.env.SERVER_ID}`;

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
								new StringSelectMenuOptionBuilder().setLabel('Work').setValue('work').setDescription('Fox Lake, IL'),
								new StringSelectMenuOptionBuilder().setLabel('Chicago').setValue('chicago').setDescription('Chicago, IL'),
								new StringSelectMenuOptionBuilder().setLabel('Toast').setValue('toast').setDescription('Fargo, ND'),
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

			await dbConnection`UPDATE hub_settings SET location = ${location[0]}, units = ${units[0]} WHERE guild_id = ${Bun.env.SERVER_ID}`;

			interaction.deferUpdate();
		}
	},
};
