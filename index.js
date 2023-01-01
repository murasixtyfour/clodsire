const { readdirSync } = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

const commands = [];
for (const file of readdirSync("./commands").filter(_file => _file.endsWith(".js"))) {
	const command = require(`./commands/${file}`);
	commands.push(command);
}
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.login(process.env.TOKEN);
client.once("ready", async () => {
	try {
		//await client.application.commands.set(commands.map(_command => _command.data));
		console.log(client.user.tag);
	}
	catch (error) {
		console.log(error);
	}
});
client.on("interactionCreate", async (interaction) => {
	if (interaction.guild && interaction.isCommand()) {
		try {
			await commands.find(_command => _command.data.name == interaction.commandName).execute(interaction);
		}
		catch (error) {
			console.log(error);
		}
	}
});
