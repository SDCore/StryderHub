const chalk = require('chalk');
const axios = require('axios');
const { emoteFile, conditionText, convertTimeToUnix, currentConditionEmote } = require('../../utils.js');
const { MessageFlags, ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, SeparatorSpacingSize } = require('discord.js');

const emotes = require(`../../data/${emoteFile(process.env.DEBUG)}Emotes.json`);

const wait = n => new Promise(resolve => setTimeout(resolve, n));

module.exports = {
	name: 'clientReady',
	once: true,
	execute(client) {
		if (process.env.ENABLED == 'false') return;

		async function updateHubData() {
			const now = Date.now();
			const minute = new Date(now).getMinutes();

			console.log(minute);
			console.log(minute % process.env.INTERVAL);

			if (minute % process.env.INTERVAL == 0) {
				const weatherURL = axios.get(`https://api.pirateweather.net/forecast/${process.env.WEATHER_API_KEY}/${process.env.WEATHER_LAT},${process.env.WEATHER_LONG}`);

				await axios
					.all([weatherURL])
					.then(
						axios.spread((...res) => {
							const weatherData = res[0].data;

							const nowUnix = Math.floor(Date.now() / 1000);

							const nowCondition = conditionText(weatherData.currently.summary);
							const todaySunriseTime = weatherData.daily.data[0].sunriseTime;
							const todaySunsetTime = weatherData.daily.data[0].sunsetTime;

							const isDayTime = nowUnix >= todaySunriseTime && nowUnix < todaySunsetTime ? 1 : 0;

							// TODO: Proper precipitation check that considers both rain and snow
							// TODO: 3-day forecast

							const hubContainer = [
								new ContainerBuilder()
									.addTextDisplayComponents(
										new TextDisplayBuilder().setContent(
											`# ${currentConditionEmote(isDayTime, nowCondition)} Weather for Mundelein, IL\n-# ${emotes.listArrow} Current Conditions: ${nowCondition}\n-# ${
												emotes.listArrow
											} Winds at ${Math.floor(weatherData.currently.windSpeed)} mph, with gusts up to ${Math.floor(weatherData.currently.windGust)} mph`,
										),
									)
									.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
									.addTextDisplayComponents(
										new TextDisplayBuilder().setContent(
											`## Today's Forecast\n### Temperature: ${weatherData.currently.temperature.toFixed(1)}°F\n-# 🌡️ Feels Like: ${weatherData.currently.apparentTemperature.toFixed(1)}°F\n-# ${
												emotes.tempHigh
											} High of ${weatherData.daily.data[0].temperatureHigh.toFixed(1)}°F at <t:${weatherData.daily.data[0].temperatureHighTime}:t>\n-# ${
												emotes.tempLow
											} Low of ${weatherData.daily.data[0].temperatureLow.toFixed(1)}°F at <t:${weatherData.daily.data[0].temperatureLowTime}:t>\n### Daylight & Precipitation\n-# Chance of Rain: ${
												weatherData.currently.precipProbability * 100
											}%\n-# Sunrise: <t:${todaySunriseTime}:t> [<t:${todaySunriseTime}:R>]\n-# Sunset: <t:${todaySunsetTime}:t> [<t:${todaySunsetTime}:R>]`,
										),
									)
									// .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
									// .addTextDisplayComponents(
									// 	new TextDisplayBuilder().setContent(
									// 		`## 3 Day Forecast\n### Tomorrow\n-# ${emotes.tempHigh} High of ${weatherData.forecast.forecastday[1].day.maxtemp_f}°F\n-# ${emotes.tempLow} Low of ${weatherData.forecast.forecastday[1].day.mintemp_f}°F`,
									// 	),
									// )
									.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
									.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Data Updated <t:${weatherData.currently.time}:f>`)),
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
		}

		updateHubData();
	},
};
