const chalk = require('chalk');
const axios = require('axios');
const {
	ButtonStyle,
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
const { emoteFile, conditionText, convertTimeToUnix } = require('../../utils.js');

const emotes = require(`../../data/${emoteFile(process.env.DEBUG)}Emotes.json`);

const wait = n => new Promise(resolve => setTimeout(resolve, n));

module.exports = {
	name: 'clientReady',
	once: true,
	execute(client) {
		if (process.env.ENABLED == 'false') return;

		async function updateHubData() {
			// get javascript current unix timestamp
			const now = Date.now();
			const minute = new Date(now).getMinutes();

			// if minute is divisible by 5, continue
			if (minute % process.env.INTERVAL != 0) return;

			const weatherURL = axios.get(`https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API}&q=${process.env.WEATHER_CODE}&days=3&aqi=no&alerts=no`);

			await axios
				.all([weatherURL])
				.then(
					axios.spread((...res) => {
						const weatherData = res[0].data;

						const timeEmote = weatherData.current.is_day ? emotes.clearDay : emotes.clearNight;

						const condition = conditionText(weatherData.current.condition.text);
						const currentSunriseTime = convertTimeToUnix(weatherData.forecast.forecastday[0].astro.sunrise);
						const currentSunsetTime = convertTimeToUnix(weatherData.forecast.forecastday[0].astro.sunset);

						const hubContainer = [
							new ContainerBuilder()
								.addTextDisplayComponents(
									new TextDisplayBuilder().setContent(
										`# ${timeEmote} Weather for ${weatherData.location.name}, ${weatherData.location.region}\n-# ${emotes.listArrow} Current Conditions: ${condition}\n-# ${emotes.listArrow} Winds ${weatherData.current.wind_dir} at ${weatherData.current.wind_mph} mph`,
									),
								)
								.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
								.addTextDisplayComponents(
									new TextDisplayBuilder().setContent(
										`## Today's Forecast\n### Temperature: ${weatherData.current.temp_f}°F\n-# 🌡️ Feels Like: ${weatherData.current.feelslike_f}°F\n-# ${emotes.tempHigh} High of ${weatherData.forecast.forecastday[0].day.maxtemp_f}°F\n-# ${emotes.tempLow} Low of ${weatherData.forecast.forecastday[0].day.mintemp_f}°F\n### Daylight\n-# Sunrise: <t:${currentSunriseTime}:t> [<t:${currentSunriseTime}:R>]\n-# Sunset: <t:${currentSunsetTime}:t> [<t:${currentSunsetTime}:R>]`,
									),
								)
								// .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
								// .addTextDisplayComponents(
								// 	new TextDisplayBuilder().setContent(
								// 		`## 3 Day Forecast\n### Tomorrow\n-# ${emotes.tempHigh} High of ${weatherData.forecast.forecastday[1].day.maxtemp_f}°F\n-# ${emotes.tempLow} Low of ${weatherData.forecast.forecastday[1].day.mintemp_f}°F`,
								// 	),
								// )
								.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
								.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Data Updated <t:${weatherData.current.last_updated_epoch}:f>`)),
						];

						const guild = client.guilds.cache.get(process.env.SERVER_ID);
						const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

						channel.messages.fetch(process.env.MESSAGE_ID).then(msg => {
							msg.edit({
								embeds: [],
								components: hubContainer,
								flags: MessageFlags.IsComponentsV2,
							});
						});

						console.log(chalk.blue(`${chalk.bold(`[BOT]`)} Hub Data Updated`));

						const now = new Date(); // allow for time passing
						var delay = 60000 - (now % 60000); // exact ms to next minute interval
						setTimeout(updateHubData, delay);
					}),
				)
				.catch(async error => {
					if (error.response) {
						console.log(chalk.yellow(`${chalk.bold('[Data Lookup Error]')} ${error.response.data}`));

						await wait(5000);

						updateHubData();
					} else if (error.request) {
						console.log(error.request);

						await wait(5000);

						updateHubData();
					} else {
						console.log(error.message);

						await wait(5000);

						updateHubData();
					}
				});
		}

		updateHubData();
	},
};
