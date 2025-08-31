const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('template').setDescription('Send a template message!'),
	async execute(interaction) {
		console.log('Test');

		const templateEmbed = new EmbedBuilder().setTitle('Template Embed').setDescription('This is a template embed. The embed will be updated once the module is enabled.');

		await interaction.channel.send({ embeds: [templateEmbed] });
		await interaction.reply({ content: 'Template posted.', ephemeral: true });
	},
};
