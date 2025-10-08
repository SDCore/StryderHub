const chalk = require('chalk');
const axios = require('axios');
const Database = require('better-sqlite3');
const { emoteFile, conditionText, currentConditionEmote } = require('../../utils.js');
const { ButtonStyle, MessageFlags, ButtonBuilder, ActionRowBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorSpacingSize } = require('discord.js');

const db_settings = new Database(`${__dirname}/../../database/settings.sqlite`);

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

			const weatherURL = axios.get(`https://api.pirateweather.net/forecast/${process.env.WEATHER_API_KEY}/${process.env.WEATHER_LAT},${process.env.WEATHER_LONG}`);
			const geoURL = axios.get(`https://api.geoapify.com/v1/geocode/search?text=${process.env.WEATHER_LAT},${process.env.WEATHER_LONG}&lang=en&limit=1&format=json&apiKey=${process.env.GEO_API_KEY}`);

			await axios
				.all([weatherURL, geoURL])
				.then(
					axios.spread(async (...res) => {
						const weatherData = res[0].data;
						const geoData = res[1].data;
						const apiData = res[0].headers;

						const nowUnix = Math.floor(Date.now() / 1000);

						const nowCondition = conditionText(weatherData.currently.summary);
						const todaySunriseTime = weatherData.daily.data[0].sunriseTime;
						const todaySunsetTime = weatherData.daily.data[0].sunsetTime;

						const isDayTime = nowUnix >= todaySunriseTime && nowUnix < todaySunsetTime ? 1 : 0;

						// TODO: Reminders
						// TODO: Shift Tracking

						function forecastDay(day) {
							const forecastText = `**<t:${weatherData.daily.data[day].time}:D>** (🌧️ ${weatherData.daily.data[day].precipProbability.toFixed(1) * 100}%)\n-# ${emotes.tempHigh} ${weatherData.daily.data[
								day
							].temperatureHigh.toFixed(1)}°F / ${emotes.tempLow} ${weatherData.daily.data[day].temperatureLow.toFixed(1)}°F\n-# ${emotes.sunrise} <t:${weatherData.daily.data[day].sunriseTime}:t> / ${
								emotes.sunset
							} <t:${weatherData.daily.data[day].sunsetTime}:t>\n`;

							return forecastText;
						}

						const toggleForecastButton = new ButtonBuilder().setCustomId('toggleThreeDayForecast').setLabel('Toggle 3-Day Forecast').setStyle(ButtonStyle.Secondary);
						const settingsButton = new ButtonBuilder().setCustomId('settings').setEmoji('⚙️').setStyle(ButtonStyle.Secondary);
						// const startShiftButton = new ButtonBuilder().setCustomId('startShift').setLabel('+').setStyle(ButtonStyle.Success).setDisabled(true);
						// const endShiftButton = new ButtonBuilder().setCustomId('endShift').setLabel('-').setStyle(ButtonStyle.Danger).setDisabled(true);

						const buttonRow = new ActionRowBuilder().addComponents(toggleForecastButton, settingsButton);

						const hubContainer = new ContainerBuilder();

						const headerText = new TextDisplayBuilder().setContent(
							`# ${currentConditionEmote(isDayTime, nowCondition)} Weather for ${geoData.results[0].city}, ${geoData.results[0].state_code}\n-# ${emotes.listArrow} Conditions are ${nowCondition} as of <t:${
								weatherData.currently.time
							}:t>\n-# ${emotes.listArrow} Winds at ${Math.floor(weatherData.currently.windSpeed)} mph, with gusts up to ${Math.floor(weatherData.currently.windGust)} mph`,
						);

						const currentText = new TextDisplayBuilder().setContent(
							`### Current Temperature: ${weatherData.currently.temperature.toFixed(1)}°F\n-# 🌡️ Feels Like: ${weatherData.currently.apparentTemperature.toFixed(1)}°F\n-# ${
								emotes.tempHigh
							} High of ${weatherData.daily.data[0].temperatureHigh.toFixed(1)}°F at <t:${weatherData.daily.data[0].temperatureHighTime}:t>\n-# ${
								emotes.tempLow
							} Low of ${weatherData.daily.data[0].temperatureLow.toFixed(1)}°F at <t:${weatherData.daily.data[0].temperatureLowTime}:t>\n### Daylight & Precipitation\n-# 🌧️ Chance of Rain: ${Math.floor(
								weatherData.currently.precipProbability * 100,
							)}%\n-# ${emotes.sunrise} Sunrise: <t:${todaySunriseTime}:t> [<t:${todaySunriseTime}:R>]\n-# ${emotes.sunset} Sunset: <t:${todaySunsetTime}:t> [<t:${todaySunsetTime}:R>]`,
						);

						hubContainer.addTextDisplayComponents(headerText);

						hubContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

						hubContainer.addTextDisplayComponents(currentText);

						// check if db settings says showForecast is true for this guild
						const showForecastRow = db_settings.prepare('SELECT showForecast FROM settings WHERE guild_id = ?').get(process.env.SERVER_ID);
						const APIDataRow = db_settings.prepare('SELECT showAPIData FROM settings WHERE guild_id = ?').get(process.env.SERVER_ID);

						if (showForecastRow && showForecastRow.showForecast) {
							const forecastText = new TextDisplayBuilder().setContent(`## 3-Day Forecast\n ${forecastDay(1)}\n ${forecastDay(2)}\n ${forecastDay(3)}`);

							hubContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

							hubContainer.addTextDisplayComponents(forecastText);

							var forecastButtonEmote = emotes.buttonOn;
						} else {
							var forecastButtonEmote = emotes.buttonOff;
						}

						if (APIDataRow && APIDataRow.showAPIData) {
							const usage = parseInt(apiData['ratelimit-limit']) - parseInt(apiData['ratelimit-remaining']);
							const usagePercent = ((usage / apiData['ratelimit-limit']) * 100).toFixed(2);
							const unixTime = Math.floor(Date.now() / 1000);
							const resetTime = Math.floor(parseInt(apiData['ratelimit-reset']) + unixTime);

							hubContainer.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Small));

							const apiText = new TextDisplayBuilder().setContent(
								[
									`## Pirate Weather API`,
									`${emotes.listArrow} Current Usage: ${usage.toLocaleString()}/${parseInt(apiData['ratelimit-limit']).toLocaleString()} (${usagePercent}%)`,
									`${emotes.listArrow} Usage Resets <t:${resetTime}:R>`,
								].join('\n'),
							);

							hubContainer.addTextDisplayComponents(apiText);

							var apiDataButtonEmote = emotes.buttonOn;
						} else {
							var apiDataButtonEmote = emotes.buttonOff;
						}

						const toggleForecastButton = new ButtonBuilder().setCustomId('toggleThreeDayForecast').setEmoji(forecastButtonEmote).setLabel('Forecast').setStyle(ButtonStyle.Secondary);
						const toggleAPIDataButton = new ButtonBuilder().setCustomId('toggleAPIData').setEmoji(apiDataButtonEmote).setLabel('API Data').setStyle(ButtonStyle.Secondary);
						// const startShiftButton = new ButtonBuilder().setCustomId('startShift').setLabel('+').setStyle(ButtonStyle.Success).setDisabled(true);
						// const endShiftButton = new ButtonBuilder().setCustomId('endShift').setLabel('-').setStyle(ButtonStyle.Danger).setDisabled(true);

						const buttonRow = new ActionRowBuilder().addComponents(toggleForecastButton, toggleAPIDataButton);

						const guild = client.guilds.cache.get(process.env.SERVER_ID);
						const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

						channel.messages.fetch(process.env.MESSAGE_ID).then(msg => {
							msg.edit({
								embeds: [],
								components: [hubContainer, buttonRow],
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

		setInterval(() => {
			const newDate = new Date();
			const currentSecond = newDate.getSeconds();
			const currentMinute = newDate.getMinutes();
			const settingsRow = db_settings.prepare('SELECT showForecast, showForecastUpdate, showAPIData, showAPIDataUpdate FROM settings WHERE guild_id = ?').get(process.env.SERVER_ID);

			if (currentSecond === 0 && currentMinute % process.env.INTERVAL == 0) {
				updateHubData();
			}

			if (settingsRow) {
				if (settingsRow.showForecast !== settingsRow.showForecastUpdate) {
					db_settings.prepare('UPDATE settings SET showForecastUpdate = ? WHERE guild_id = ?').run(settingsRow.showForecast, process.env.SERVER_ID);

					updateHubData();

					console.log(chalk.blue(`${chalk.bold('[BUTTON]')} 3-Day Forecast Toggled`));
				}

				if (settingsRow.showAPIData !== settingsRow.showAPIDataUpdate) {
					db_settings.prepare('UPDATE settings SET showAPIDataUpdate = ? WHERE guild_id = ?').run(settingsRow.showAPIData, process.env.SERVER_ID);

					updateHubData();

					console.log(chalk.blue(`${chalk.bold('[BUTTON]')} API Data Toggled`));
				}
			}
		}, 1000);

		updateHubData();
	},
};
