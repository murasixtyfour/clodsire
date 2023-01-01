const { getPaletteFromURL } = require("color-thief-node");
const convert = require("color-convert");
const nearestColor = require("nearest-color").from({
	"normal": "fff900",
	"fire": "ff6d00",
	"water": "0051ff",
	"electric": "ffce00",
	"grass": "5fff00",
	"ice": "00fff4",
	"fighting": "ff0a00",
	"poison": "ff00fa",
	"ground": "ffb800",
	"flying": "4200ff",
	"psychic": "ff004e",
	"bug": "e1ff00",
	"rock": "ffd500",
	"ghost": "7000ff",
	"dragon": "4a00ff",
	"dark": "ff6700",
	"steel": "0000ff",
	"fairy": "ff007e"
});
const { create } = require("random-seed");
const _ = require("lodash");
const fetch = require("node-fetch");
const bar = require("progress-string")({
	"total": 250,
	"width": 10,
	"incomplete": "‌",
	"complete": "▂"
});
const { table, getBorderCharacters } = require("table");
const options = {
	"border": getBorderCharacters("void"),
	"columnDefault": {
		"paddingLeft": 0,
		"paddingRight": 1
	},
	"drawHorizontalLine": () => false
}

module.exports = {
	"data": {
		"name": "generate",
		"description": "image-to-pokemon generator",
		"options": [{
			"type": 11,
			"name": "image",
			"description": "image file of your pokemon",
			"required": true
		}]
	},
	"execute": async (interaction) => {
		const attachment = interaction.options.getAttachment("image");
		if (attachment.contentType.startsWith("image/")) {
			const interactionReply = await interaction.reply("generating");
			const url = attachment.url;
			const palette = await getPaletteFromURL(url);
			let types = [];
			for (let i = 0; i < 2; i++) {
				types.push(nearestColor(convert.rgb.hex(palette[i])));
			}
			types = _.uniqBy(types, "name");
			let typeString = "";
			for (const type of types) {
				typeString += `${type.name}\n`;
			}
			let rand = create(convert.rgb.hex(palette[2]));
			let abilities = [];
			for (let i = 0; i < 3; i++) {
				abilities.push(await (await fetch(`https://pokeapi.co/api/v2/ability/${rand(267) + 1}`)).json());
			}
			abilities = _.uniqBy(abilities, "name").filter(move => move.pokemon.length > 3);
			let abilityString = "";
			if (!abilities.length) abilityString = "no-ability";
			else {
				for (const ability of abilities) {
					abilityString += `${ability.name}\n`;
				}
			}
			rand = create(convert.rgb.hex(palette[3]));
			const statNames = ["HP", "ATK", "DEF", "SPA", "SPD", "SPE"];
			const statTemps = [];
			for (let i = 0; i < 6; i++) {
				statTemps.push(rand(100));
			}
			const totalTemp = statTemps.reduce((a, b) => a + b, 0);
			const stats = [];
			for (let i = 0; i < 6; i++) {
				let stat = Math.round((rand(300) + 300) * statTemps[i] / totalTemp);
				if (stat < 25) stat = 25;
				else if (stat > 250) stat = 250;
				stats.push(stat);
			}
			const total = stats.reduce((a, b) => a + b, 0);
			const statTable = [];
			for (let i = 0; i < 6; i++) {
				statTable.push([statNames[i], stats[i], `# ${bar(stats[i])}`]);
			}
			let statString = table(statTable, options);
			await interaction.editReply({
				"content": "",
				"embeds": [{
					"thumbnail": {
						"url": url
					},
					"fields": [
						{
							"name": "Type",
							"value": "```\n" + typeString + "```",
							"inline": true
						}, {
							"name": "Abilities",
							"value": "```\n" + abilityString + "```",
							"inline": true
						}, {
							"name": "Stats",
							"value": "```glsl\n" + statString + "```"
						}
					]
				}],
				"components": [{
					"type": 1,
					"components": [{
						"type": 2,
						"label": "Moves",
						"style": 2,
						"custom_id":"button"
					}]
				}]
			});
			const interactionCollector = interactionReply.createMessageComponentCollector({
				"time": 60000,
				"max": 1
			});
			interactionCollector.on("collect", async componentInteraction => {
				await componentInteraction.reply("generating");
				rand = create(convert.rgb.hex(palette[4]));			
				let moves = [];
				for (const type of types) {
					const moveTs = (await (await fetch(`https://pokeapi.co/api/v2/type/${type.name}`)).json()).moves;
					for (let i = 0; i < 30 / types.length; i++) {
						moves.push(await (await fetch(moveTs[rand(moveTs.length)].url)).json());
					}
				}
				for (let i = 0; i < 30; i++) {
					moves.push(await (await fetch(`https://pokeapi.co/api/v2/move/${rand(826) + 1}`)).json());
				}
				moves = _.uniqBy(moves, "name").filter(move => move.learned_by_pokemon.length > 3).sort((a, b) => {
					if (a.power && b.power) return a.power - b.power;
					else return 0;
				});
				const moveTable = [];
				for (const move of moves) {
					let diff = "***";
					if (move.damage_class.name == "physical") diff = "+";
					else if (move.damage_class.name == "special") diff = "-";
					moveTable.push([diff, move.name, move.type.name, move.power || "", move.accuracy || ""]);
				}
				let moveString = table(moveTable, options);
				await componentInteraction.editReply({
					"content": "",
					"embeds":[{
						"title": "Moves",
						"description": "```diff\n" + moveString + "```"
					}]
				});
			});
			interactionCollector.on("end", async () => {
				await interaction.editReply({
					"components": [{
						"type": 1,
						"components": [{
							"type": 2,
							"label": "Moves",
							"style": 2,
							"custom_id":"button",
							"disabled": true
						}]
					}]
				});
			});
		}
		else await interaction.reply("invalid image");
	}
}
