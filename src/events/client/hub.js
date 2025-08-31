const chalk = require('chalk');
const axios = require('axios');
const {
	ButtonStyle,
	EmbedBuilder,
	MessageFlags,
	ButtonBuilder,
	SectionBuilder,
	MediaGalleryItem,
	ContainerBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	MediaGalleryBuilder,
	SlashCommandBuilder,
	SeparatorSpacingSize,
} = require('discord.js');

const wait = n => new Promise(resolve => setTimeout(resolve, n));

module.exports = {
	name: 'clientReady',
	once: true,
	execute(client) {
		if (process.env.ENABLED == 'false') return;

		async function updateStatus() {
			// get javascript current unix timestamp
			const now = Date.now();
			const minute = new Date(now).getMinutes();

			// if minute is divisible by 5, continue
			if (minute % process.env.INTERVAL != 0) return;

			const weatherURL = axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API}&q=${process.env.WEATHER_CODE}&days=1&aqi=no&alerts=no`);

			await axios
				.all([weatherURL])
				.then(
					axios.spread((...res) => {
						const weatherData = res[0].data;

						// const statusEmbed = new EmbedBuilder()
						// 	.setTitle('Apex Legends Server Status')
						// 	.setDescription(`**Announcements**\n\n**Last Updated:**`)
						// 	.addFields([
						// 		{
						// 			name: `weather for ${weatherData.location.name} ${weatherData.location.region}`,
						// 			value: `local time: <t:${weatherData.current.last_updated_epoch}:f>\ntemp: ${weatherData.current.temp_f}*F`,
						// 			inline: true,
						// 		},
						// 	])
						// 	.setFooter({ text: `bread` })
						// 	.setTimestamp();

						const hubContainer = [
							new ContainerBuilder()
								.addTextDisplayComponents(
									new TextDisplayBuilder().setContent(`# 🌤️ Weather for ${weatherData.location.name}, ${weatherData.location.region}\n### Conditions are ${weatherData.current.condition.text}`),
								)
								.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
								.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Current Temperature: ${weatherData.current.temp_f}°F`))
								.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
								.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Last Updated: <t:${weatherData.current.last_updated_epoch}:f>`)),
						];

						const guild = client.guilds.cache.get(process.env.SERVER_ID);
						const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

						channel.messages.fetch(process.env.MESSAGE_ID).then(msg => {
							msg.edit({
								embeds: null,
								components: hubContainer,
								flags: MessageFlags.IsComponentsV2,
							});
						});

						console.log(chalk.blue(`${chalk.bold(`[BOT]`)} Server status embed updated`));

						const now = new Date(); // allow for time passing
						var delay = 60000 - (now % 60000); // exact ms to next minute interval
						setTimeout(updateStatus, delay);
					}),
				)
				.catch(async error => {
					if (error.response) {
						console.log(chalk.yellow(`${chalk.bold('[Status Lookup Error]')} ${error.response.data}`));

						await wait(5000);

						updateStatus();
					} else if (error.request) {
						console.log(error.request);

						await wait(5000);

						updateStatus();
					} else {
						console.log(error.message);

						await wait(5000);

						updateStatus();
					}
				});
		}

		updateStatus();
	},
};
