const chalk = require('chalk');
const axios = require('axios');
const { emoteFile, conditionText, currentConditionEmote } = require('../../utils.js');
const { ActionRow, ButtonStyle, MessageFlags, ButtonBuilder, ActionRowBuilder, ContainerBuilder, SeparatorBuilder, TextDisplayBuilder, SeparatorSpacingSize } = require('discord.js');

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

			if (minute % process.env.INTERVAL == 0) {
				const weatherURL = axios.get(`https://api.pirateweather.net/forecast/${process.env.WEATHER_API_KEY}/${process.env.WEATHER_LAT},${process.env.WEATHER_LONG}`);

				await axios
					.all([weatherURL])
					.then(
						axios.spread(async (...res) => {
							const weatherData = res[0].data;

							const nowUnix = Math.floor(Date.now() / 1000);

							const nowCondition = conditionText(weatherData.currently.summary);
							const todaySunriseTime = weatherData.daily.data[0].sunriseTime;
							const todaySunsetTime = weatherData.daily.data[0].sunsetTime;

							const isDayTime = nowUnix >= todaySunriseTime && nowUnix < todaySunsetTime ? 1 : 0;

							// TODO: Reminders
							// TODO: Shift Tracking

							function forecastDay(day) {
								const forecastText = `**<t:${weatherData.daily.data[day].time}:D>** (🌧️ ${weatherData.daily.data[day].precipProbability * 100}%)\n${emotes.tempHigh} ${weatherData.daily.data[
									day
								].temperatureHigh.toFixed(1)}°F / ${emotes.tempLow} ${weatherData.daily.data[day].temperatureLow.toFixed(1)}°F\n`;

								return forecastText;
							}

							const startShiftButton = new ButtonBuilder().setCustomId('startShift').setLabel('+').setStyle(ButtonStyle.Success);
							const endShiftButton = new ButtonBuilder().setCustomId('endShift').setLabel('-').setStyle(ButtonStyle.Danger);
							const toggleForecastButton = new ButtonBuilder().setCustomId('toggleThreeDayForecast').setLabel('Toggle Forecast').setStyle(ButtonStyle.Secondary);

							const buttonRow = new ActionRowBuilder().addComponents(startShiftButton, endShiftButton, toggleForecastButton);

							const hubContainer = [
								new ContainerBuilder()
									.addTextDisplayComponents(
										new TextDisplayBuilder().setContent(
											`# ${currentConditionEmote(isDayTime, nowCondition)} Weather for Mundelein, IL\n-# ${emotes.listArrow} Conditions are ${nowCondition} as of <t:${
												weatherData.currently.time
											}:t>\n-# ${emotes.listArrow} Winds at ${Math.floor(weatherData.currently.windSpeed)} mph, with gusts up to ${Math.floor(weatherData.currently.windGust)} mph`,
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
									.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
									.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 3-Day Forecast\n ${forecastDay(1)}\n ${forecastDay(2)}\n ${forecastDay(3)}`)),
							];

							const guild = client.guilds.cache.get(process.env.SERVER_ID);
							const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

							channel.messages.fetch(process.env.MESSAGE_ID).then(msg => {
								msg.edit({
									embeds: [],
									components: [hubContainer[0]],
									flags: MessageFlags.IsComponentsV2,
								});
							});

							console.log(chalk.blue(`${chalk.bold(`[BOT]`)} Hub Data Updated`));
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

			const newDate = new Date(); // allow for time passing
			var delay = 60000 - (newDate % 60000); // exact ms to next minute interval
			setTimeout(updateHubData, delay);
		}

		updateHubData();
	},
};
