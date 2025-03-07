require("dotenv").config();
const { REST, Routes } = require('discord.js');
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });
const { EmbedBuilder } = require('discord.js');
//const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');

const net = require('net');
const internal = require("stream");
const fs = require('fs');

const color = [68, 132, 235]


const m0 = "Default"
const m1 = "Monticello Raceway"
const m2 = "Racing Field"
const m3 = "Crash Test Site"
//const m4 = "Canyon 2"
const m4 = "Canyon"
const m5 = "Salt Flats"
const m6 = "Desert 2"
const m7 = "Desert"
const m8 = "Mountain"
const m9 = "Airport"
const m10 = "Highlands"
const m11 = "Derby Arena"
const m12 = "Dieseldorf"
const m13 = "Doro-Toshi"
const m14 = "Extreme Stunt Map"
const m15 = "Forest Muddy Road"
const m16 = "Le Mans - Circuit de la Sarthe"
const m17 = "Mountain Routes"
const m18 = "North Island"
const m19 = "San Angelo"
const m20 = "San Fortuna"
const m21 = "Sand Canyon"
const m22 = "Snowlandia"
const m23 = "The Drag Strip"

const maps = [m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15, m16, m17, m18, m19, m20, m21, m22, m23]


const commands = [
    {
        name: 'startserver',
        description: 'Starts a server based on parameters that you choose.',
        options: [
            {
                name: 'map',
                type: 3,
                description: 'The map that the server will use.',
                required: true,
                autocomplete: true
            },
            {
                name: 'region',
                description: 'The region where your server will be hosted. Try typing a few random characters to update the list.',
                type: 3,
                required: true,
                autocomplete: true,
            },
            {
                name: 'physics',
                type: 3,
                description: 'The physics mode that your server to use. (default: 2kHz)',
                required: false,
                choices: [
                    {
                        "name": "Simplified (1kHz)",
                        "value": "0"
                    },
                    {
                        "name": "Advanced (2kHz)",
                        "value": "1"
                    },
                ]
            },
            {
                name: 'timeout',
                type: 4,
                description: 'How many hours the server will stay on before automatically closing. (4-8; default: 4)',
                required: false,
                min_value: 4,
                max_value: 8
            },

        ]
    },
    {
        name: 'closeserver',
        description: 'Closes your own server.',
    },
    {
        name: 'servers',
        description: 'Some statistics about the current servers.',
    },
    {
        name: 'nodes',
        description: 'Some statistics about the connected nodes.',
    },
    {
        name: 'maps',
        description: 'A list of all of the custom maps that are available, and a link to download them.'
    },
    {
        name: 'about',
        description: 'Some information about the bot and its creation.'
    },
    {
        name: 'help',
        description: 'A list of all commands and how to use them.'
    },

];

client.login(process.env.TOKEN);


const connections = [];
const servers = [];


function startSocket() {
    const socketServer = net.createServer((socket) => {
        console.log(socket.remoteAddress, "connected. Current connections", connections.length + 1);
        socket.on("data", async (buffer) => {
            const data = buffer.toString("utf-8")
            console.log(data)
            if (data.startsWith("SETUP")) {
                await client.guilds.cache.get("" + process.env.GUILD_ID).members.fetch({ force: true });
                let user = client.guilds.cache.get("" + process.env.GUILD_ID).members.cache.get("" + data.substring(data.indexOf("uid:") + 4));
                if (user == undefined) {
                    socket.write("INVALID_USER_ID");
                    socket.end();
                    return;
                }
                if (data.substring(data.indexOf("version:") + 8, data.indexOf("uid:") - 1) != JSON.parse(fs.readFileSync("./package.json")).version) {
                    socket.write("INVALID_VERSION:" + JSON.parse(fs.readFileSync("./package.json")).version);
                    socket.end();
                    return;
                }
                let username = user.displayName;
                let location = data.substring(data.indexOf("location:") + 9, data.indexOf("maxServers:") - 1);
                connections.forEach(element => {
                    if (element.location == location && element.username == username) {
                        socket.write("ALREADY_EXISTS");
                        socket.end();
                        return;
                    }
                });
                connections.push({
                    "socket": socket,
                    "timeConnected": unixTime(),
                    "id": Math.floor(Math.random() * 100000000),
                    "location": location,
                    "username": username,
                    "maxServers": Number(data.substring(data.indexOf("maxServers:") + 11, data.indexOf("maxPlayers:") - 1)),
                    "maxPlayers": Number(data.substring(data.indexOf("maxPlayers:") + 11, data.indexOf("version:") - 1)),
                    "uid": data.substring(data.indexOf("uid:") + 4),
                });
                //console.log(connections);
            } else if (data.startsWith("CLOSE ")) {
                let interaction;
                console.log(data.substring(data.indexOf(":") + 1))
                for (let i = 0; i < servers.length; i++) {
                    if (servers[i].uid == data.substring(data.indexOf(":") + 1)) {
                        interaction = servers[i].interaction;
                    }
                }
                if (data.substring(6).startsWith("inactive:")) {
                    interaction.channel.send(interaction.member.displayName + "'s Server closed after 20 minutes of inactivity");
                    //interaction.followUp(interaction.member.displayName + "'s Server closed after 20 minutes of inactivity");
                    for (let i = 0; i < servers.length; i++) {
                        if (servers[i].uid == interaction.user.id) {
                            servers.splice(i, 1);
                            i--;
                        }
                    }
                } else if (data.substring(6).startsWith("warn:")) {
                    interaction.channel.send(interaction.member.displayName + "'s Server will close in 10 minutes");
                } else if (data.substring(6).startsWith("timeout:")) {
                    interaction.channel.send(interaction.member.displayName + "'s Server closed");
                    for (let i = 0; i < servers.length; i++) {
                        if (servers[i].uid == interaction.user.id) {
                            servers.splice(i, 1);
                            i--;
                        }
                    }
                }
            }
        })

        socket.on('close', () => {
            for (let i = 0; i < servers.length; i++) {
                if (socket == servers[i].socket) {
                    servers.splice(i, 1);
                    i--;
                }
            }
            for (let i = 0; i < connections.length; i++) {
                if (socket == connections[i].socket) {
                    connections.splice(i, 1);
                }
            }
            console.log(socket.remoteAddress, "disconnected. Remaining connections:", connections.length);
        });

        socket.on('error', (err) => {
            console.error(`Socket error: ${err.message}`);
        });
        socket.on("end", () => {
            console.log("Closed", socket.remoteAddress, "port", socket.remotePort);
        })
    })
    socketServer.listen(59898)
}


client.once('ready', async guilds => {
    try {
        console.log(`Logged in as ${client.user.tag} using node.js ` + process.version);
        client.user.setPresence({ activities: [{ name: '/startserver' }], status: 'online' });
        startSocket();
    } catch (e) { console.log(e) }
});

client.on('messageCreate', async message => {
    try {
        if (message.mentions.roles.has('853978287100657733')) {
            let promises = [];
            connections.forEach(element => {
                element.socket.write("AVAILABLE");
                promises.push(new Promise((resolve, reject) => {
                    async function tryAgain() {
                        element.socket.once("data", (buffer) => {
                            const data = buffer.toString("utf-8");
                            if (data.startsWith("AVAILABLE ")) {
                                resolve(element.id + data);
                            } else {
                                tryAgain();
                            }
                        })
                    }
                    tryAgain();
                }))
            });
            await Promise.all(promises).then(async (responses) => {
                const available = [];
                responses.forEach(element => {
                    if (Number(element.substring(element.indexOf("AVAILABLE ") + 10)) > 0) { available.push(element); }
                });
                if (available.length > 0) {
                    message.reply('You can start a server with </startserver:1113665470378278934>.');
                }
            });
        }
    } catch (e) { console.log(e) }
})

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            //  console.log(interaction)
            if (interaction.commandName == 'ping') {
                await interaction.reply('Pong! `' + client.ws.ping + ' ms`');
            } else if (interaction.commandName == 'startserver') {
                if (servers.some(server => server.uid == interaction.user.id)) {
                    await interaction.reply("You alread have a server running. Close it using </closeserver:1115495059475939428> before starting a new one.");
                    return;
                }
                await interaction.deferReply();
                const region = interaction.options.getString('region');
                const map = interaction.options.getString('map')
                const physics = interaction.options.getString('physics') || 1;
                const timeout = interaction.options.getInteger('timeout') || 4;
                console.log(map, region, physics)
                if (isNaN(parseInt(region))) {
                    await interaction.editReply("Your selected region is invalid. Please only use the autofilled options.")
                    return;
                }
                if (!maps.includes(map)) {
                    await interaction.editReply("Your selected map is invalid. Please only use the autofilled options.")
                    return;
                }

                if (region == "-1") {
                    await interaction.editReply("There are no nodes connected. Try asking a <@&853978287100657733> to start one.", { "allowed_mentions": { "parse": [] } });
                    return;
                }
                let index = 0;
                for (let i = 0; i < connections.length; i++) {
                    if (connections[i].id == region) { index = i; }
                }
                const socket = connections[index].socket;
                if (socket == undefined) {
                    await interaction.editReply("That region is not connected. Try refreshing your Discord client. (Ctrl + R)");
                    return;
                }
                // socket.write(`START${serverToStart}dcbserver_x64.exe -batchmode -nographics -logFile dcbserver${serverToStart - 2}.log -server_name:Server #${serverToStart} -server_port:${server_port} -auth_port:${auth_port} -query_port:${query_port} -server_map:${mapNumber(map)} -server_max_players:10 -server_physics:${physics}`)
                socket.write(`START map:${map} physics:${physics} id:${interaction.user.id} timeout:${timeout} name:${interaction.member.displayName}'s Server`);
                const response = await new Promise((resolve, reject) => {
                    async function tryAgain() {
                        socket.once("data", (buffer) => {
                            const data = buffer.toString("utf-8");
                            if (data.startsWith("START ")) {
                                resolve(data);
                            } else {
                                tryAgain();
                            }
                        })
                    }
                    tryAgain();
                })
                if (response.substring(6) == "full") {
                    let promises = [];
                    connections.forEach(element => {
                        element.socket.write("AVAILABLE");
                        promises.push(new Promise((resolve, reject) => {
                            async function tryAgain() {
                                element.socket.once("data", (buffer) => {
                                    const data = buffer.toString("utf-8");
                                    if (data.startsWith("AVAILABLE ")) {
                                        resolve(element.id + data);
                                    } else {
                                        tryAgain();
                                    }
                                })
                            }
                            tryAgain();
                        }))
                    });
                    await Promise.all(promises).then(async (responses) => {
                        const available = [];
                        responses.forEach(element => {
                            if (Number(element.substring(element.indexOf("AVAILABLE ") + 10)) > 0) { available.push(element); }
                        });
                        if (available.length == 0) {
                            await interaction.editReply("All servers are currently in use. Use </servers:1115495059475939429> to find one that you want to join.");
                        } else {
                            let fields = [];
                            available.forEach(element => {
                                let connection;
                                for (let i = 0; i < connections.length; i++) {
                                    if (connections[i].id == element.substring(0, element.indexOf("AVAILABLE "))) {
                                        connection = connections[i]
                                    }
                                }
                                fields.push({
                                    name: `${connection.location} (${connection.username})`,
                                    value: `Current servers: ${Math.abs(element.substring(element.indexOf("AVAILABLE ") + 10) - connection.maxServers)}/${connection.maxServers}\n` +
                                        `Hosted by: <@${connection.uid}>`,
                                    inline: true
                                })
                            })
                            const embed = new EmbedBuilder()
                                .setColor(color)
                                .setTitle('DCB Server Bot - Available Regions')
                                .addFields(fields)
                            await interaction.editReply({ content: "That region is currently full. Try one of these regions instead.", embeds: [embed] })
                        }
                    });
                    return;
                } else if (response.substring(6) == "error") {
                    interaction.editReply(`An unknown error has occured. Try again, or ask the host to fix it (<@${connections[index].uid}>)`, { "allowed_mentions": { "parse": [] } });
                } else if (response.substring(6) == "error1") {
                    interaction.editReply(`The required ports are not available. Ask the host to fix it (<@${connections[index].uid}>)`, { "allowed_mentions": { "parse": [] } });
                } else if (response.substring(6) == "started") {
                    const embed = new EmbedBuilder()
                        .setColor(color)
                        .setTitle(`DCB Server Bot - ${interaction.member.displayName}'s Server started`)
                        .setDescription(`Map: ${map}\n` +
                            `Physics: ${translatePhysics(physics)}\n` +
                            `Max players: ${connections[index].maxPlayers}\n` +
                            `Closes at: <t:${unixTime() + (3600 * timeout)}:t>\n` +
                            `Region: ${connections[index].location}\n` +
                            `Hosted by <@${connections[index].uid}>`
                        );
                    interaction.editReply({ content: 'Remember to </closeserver:1115495059475939428> when you\'re done with it.', embeds: [embed] });
                    servers.push({
                        "id": region,
                        "region": connections[index].location,
                        "name": `${interaction.member.displayName}'s Server`,
                        "socket": socket,
                        "maxPlayers": connections[index].maxPlayers,
                        "uid": interaction.user.id,
                        "hostId": connections[index].uid,
                        "closeTime": unixTime() + (3600 * timeout),
                        "map": map,
                        "physics": translatePhysics(physics),
                        "interaction": interaction
                    })
                    console.log(`${interaction.member.displayName}'s Server started`);
                }

            } else if (interaction.commandName == 'servers') {
                if (servers.length == 0 && connections.length > 0) {
                    interaction.reply('No servers are currently running. Start one with </startserver:1113665470378278934>.');
                    return;
                } else if (servers.length == 0 && connections.length == 0) {
                    interaction.reply("There are no nodes connected. Try asking a <@&853978287100657733> to start one.", { "allowed_mentions": { "parse": [] } });
                    return;
                }
                await interaction.deferReply();
                let promises = [];
                for (const element of servers) {
                    await element.socket.write("PLAYERS " + element.uid);

                    const promise = await new Promise(async (resolve, reject) => {
                        async function tryAgain() {
                            await element.socket.once("data", async (buffer) => {
                                const data = await buffer.toString("utf-8");
                                if (data.startsWith("PLAYERS ")) {
                                    resolve({
                                        name: element.name,
                                        value: `Started by: <@${element.uid}>\n` +
                                            `Map: ${element.map}\n` +
                                            `Physics: ${element.physics}\n` +
                                            `Region: ${element.region}\n` +
                                            `Current players: ${data.substring(8)}/${element.maxPlayers}\n` +
                                            `Closes at: <t:${element.closeTime}:t>\n` +
                                            `Hosted by: <@${element.hostId}>`,
                                        inline: true
                                    });
                                } else {
                                    await tryAgain();
                                }
                            });
                        }

                        await tryAgain();
                    });

                    promises.push(promise);
                }

                await Promise.all(promises).then(async (responses) => {
                    const embed = new EmbedBuilder()
                        .setColor(color)
                        .setTitle('DCB Server Bot - Servers')
                        .addFields(responses);
                    await interaction.editReply({ embeds: [embed] });
                });
            } else if (interaction.commandName == "nodes") {
                await interaction.deferReply();
                let promises = [];
                connections.forEach(element => {
                    element.socket.write("AVAILABLE");
                    promises.push(new Promise((resolve, reject) => {
                        async function tryAgain() {
                            element.socket.once("data", (buffer) => {
                                const data = buffer.toString("utf-8");
                                if (data.startsWith("AVAILABLE ")) {
                                    resolve(element.id + data);
                                } else {
                                    tryAgain();
                                }
                            })
                        }
                        tryAgain();
                    }))
                });
                await Promise.all(promises).then(async (responses) => {
                    if (responses.length == 0) {
                        await interaction.editReply("There are no nodes connected. Try asking a <@&853978287100657733> to start one.", { "allowed_mentions": { "parse": [] } });
                    } else {
                        let fields = [];
                        responses.forEach(element => {
                            let connection;
                            for (let i = 0; i < connections.length; i++) {
                                if (connections[i].id == element.substring(0, element.indexOf("AVAILABLE "))) {
                                    connection = connections[i]
                                }
                            }
                            fields.push({
                                name: `${connection.location} (@${connection.username})`,
                                value: `Current servers: ${Math.abs(element.substring(element.indexOf("AVAILABLE ") + 10) - connection.maxServers)}/${connection.maxServers}\n` +
                                    `Hosted by: <@${connection.uid}>`,
                                inline: true
                            });
                        })
                        const embed = new EmbedBuilder()
                            .setColor(color)
                            .setTitle('DCB Server Bot - Nodes')
                            .addFields(fields)
                        await interaction.editReply({ embeds: [embed] })
                    }
                });
            } else if (interaction.commandName == 'closeserver') {
                if (servers.some(server => server.uid == interaction.user.id)) {
                    for (let i = 0; i < servers.length; i++) {
                        if (servers[i].uid == interaction.user.id) {
                            servers[i].socket.write("CLOSE " + servers[i].uid);
                            servers.splice(i, 1);
                            i--;
                        }
                    }
                    interaction.reply(`Successfully closed ${interaction.member.displayName}'s Server`);
                } else if (interaction.user.id == '523631946899783796') {
                    for (let i = 0; i < servers.length; i++) {
                        servers[i].socket.write("CLOSE " + servers[i].uid);
                        servers.splice(i, 1);
                        i--;
                    }
                    interaction.reply('Closed all servers.');
                } else {
                    interaction.reply('You do not have a server running. Start one with </startserver:1113665470378278934>.');
                }

            } else if (interaction.commandName == 'maps') {
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('DCB Server Bot - Custom Maps')
                    .setDescription('Ping <@523631946899783796> if you want a new map to be added.\n\n' +
                        `${getLink(m11)}\n` +
                        `${getLink(m12)}\n` +
                        `${getLink(m13)}\n` +
                        `${getLink(m14)}\n` +
                        `${getLink(m15)}\n` +
                        `${getLink(m16)}\n` +
                        `${getLink(m17)}\n` +
                        `${getLink(m18)}\n` +
                        `${getLink(m19)}\n` +
                        `${getLink(m20)}\n` +
                        `${getLink(m21)}\n` +
                        `${getLink(m22)}\n` +
                        `${getLink(m23)}`
                    )
                interaction.reply({ embeds: [embed] })
            } else if (interaction.commandName == 'about') {
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('DCB Server Bot - About')
                    .setDescription('Bot created by <@523631946899783796>')
                    .addFields(
                        {
                            name: 'GitHub',
                            value: `Please star [this repo on GitHub](https://github.com/aProfessionalFrog/Dream-Car-Builder-Bot). ` +
                                `I spent a lot of time on this, so I would appriciate your support.`
                        },
                        {
                            name: 'Nodes',
                            value: `A "node" is what I call the part that actually starts the DCB server. Nodes don't have any connection to Discord. ` +
                                `They connect to a server created by the Discord bot which it can communicate with to start and manage servers. ` +
                                `Anyone can host a node, for more info, see the section below.`
                        },
                        {
                            name: 'Hosting Nodes',
                            value: `The [GitHub repo](https://github.com/aProfessionalFrog/Dream-Car-Builder-Bot) has more information about hosting nodes. ` +
                                `Read README.md for proper instructions.`
                        },
                    )
                interaction.reply({ embeds: [embed] })
            } else if (interaction.commandName == 'help') {
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('DCB Server Bot - Help')
                    .setDescription('Ping <@523631946899783796> if you have any additional questions.')
                    .addFields(
                        {
                            name: '</startserver:1113665470378278934>',
                            value: `Starts a server based on parameters that you choose.\n` +
                                `**[map]** - The map that the server will use. Use </maps:1116942886966132737> to quickly download custom maps.\n` +
                                `**[region]** - The region where your server will be hosted.\n` +
                                `**[physics]** - The physics mode that your server to use. (default: 2kHz)\n` +
                                `**[timeout]** - How many hours the server will stay on before automatically closing. (4-8; default: 4)`
                        },
                        { name: '</closeserver:1115495059475939428>', value: `Closes your own server.` },
                        { name: '</servers:1115495059475939429>', value: `Some statistics about the current servers.` },
                        { name: '</nodes:1245105586354520135>', value: `Some statistics about the connected nodes.` },
                        { name: '</maps:1116942886966132737>', value: `A list of all of the custom maps that are available, and a link to download them.` },
                        //{ name: '</ping:1113665470378278933>', value: `Displays the ping of the bot to Discord, not from you to the DCB server.` },
                        { name: '</about:1296284706236665856>', value: `Some information about the bot and its creation.` },
                        { name: '</help:1116942886966132738>', value: `A list of all commands and how to use them.` },
                    )
                interaction.reply({ embeds: [embed] })
            }

        } else if (interaction.isAutocomplete()) {
            // autocomplete
            /*const { commands } = client;
            const { commandName } = interaction;
            const command = commands.get(commandName);
         
            if (!command) {
                console.error(`No command matching ${ interaction.commandName } was found.`);
                return;
            }
            */
            //await command.autocomplete(interaction);
            let response;
            const focusedOption = interaction.options.getFocused(true);
            if (focusedOption.name == 'map') {
                const filtered = maps.filter(choice => choice.startsWith(focusedOption.value));
                response = filtered.map(choice => ({ name: choice, value: choice }))
            }
            else if (focusedOption.name == 'region') {
                response = []
                if (connections.length == 0) {
                    response.push({ name: `There are no nodes connected. Try asking a @Multiplayer Host to start one.`, value: "-1" });
                } else {
                    for (let i = 0; i < connections.length; i++) {
                        response.push({ name: `${connections[i].location} (@${connections[i].username})`, value: '' + connections[i].id });
                    }
                }
                //response = response.filter(choice => choice['name'].startsWith(focusedOption.value));
            }
            interaction.respond(response);
        }
    } catch (e) { console.log(e) }
})

function getLink(m) {
    switch (m) {
        case 'Derby Arena': return '**[Derby Arena](https://steamcommunity.com/sharedfiles/filedetails/?id=2157450483)**';
        case 'Dieseldorf': return '**[Dieseldorf](https://steamcommunity.com/sharedfiles/filedetails/?id=2006844531)**';
        case 'Doro-Toshi': return '**Doro-Toshi** - Not yet released';
        case 'Extreme Stunt Map': return '**[Extreme Stunt Map](https://steamcommunity.com/sharedfiles/filedetails/?id=2442503699)**';
        case 'Forest Muddy Road': return '**[Forest Muddy Road](https://steamcommunity.com/sharedfiles/filedetails/?id=1947646825)**';
        case 'Le Mans - Circuit de la Sarthe': return '**[Le Mans - Circuit de la Sarthe](https://steamcommunity.com/sharedfiles/filedetails/?id=2825798206)**';
        //case 'Mountain Routes': return '**[Mountain Routes](https://steamcommunity.com/sharedfiles/filedetails/?id=1909626912)**';
        case 'Mountain Routes': return '**Mountain Routes** - No longer available :(';
        case 'North Island': return '**[North Island](https://steamcommunity.com/sharedfiles/filedetails/?id=2535612887)**';
        case 'San Angelo': return '**[San Angelo](https://steamcommunity.com/sharedfiles/filedetails/?id=1760512304)**';
        case 'San Fortuna': return '**[San Fortuna](https://steamcommunity.com/sharedfiles/filedetails/?id=1876635951)**';
        case 'Sand Canyon': return '**[Sand Canyon](https://steamcommunity.com/sharedfiles/filedetails/?id=2185947984)**';
        case 'Snowlandia': return '**[Snowlandia](https://steamcommunity.com/sharedfiles/filedetails/?id=2911609015)**';
        case 'The Drag Strip': return '**[The Drag Strip](https://steamcommunity.com/sharedfiles/filedetails/?id=2278284026)**';
        default: return 'Not a map';
    }
}


function unixTime() {
    try {
        return Math.round(Date.now() / 1000)
    } catch (e) { console.log(e) }
}

function translatePhysics(p) {
    try {
        if (p == 1) return "Advanced (2kHz)"
        else return "Simplified (1kHz)"
    } catch (e) { console.log(e) }
}


const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(process.env.CLIENT), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
