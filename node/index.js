require('dotenv').config();
const net = require("net");
const fs = require('fs');
const treeKill = require('tree-kill');
const { exec } = require('child_process');

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

const ports = [];
const servers = [];


for (let i = process.env.START_PORT; i <= process.env.END_PORT; i++) {
    ports.push(Number(i));
}
if (process.env.LOCATION.length < 1 || process.env.LOCATION.length > 40) {
    console.error("LOCATION length must be between 1 and 40 characters");
    process.exit(1);
}
if (process.env.LOCATION.includes(":")) {
    console.error("Environment variable values cannot contain a colon character (:)");
    process.exit(1);
}
if (process.env.MAX_SERVERS < 1) {
    console.error("MAX_SERVERS must be greater than 1");
    process.exit(1);
}
if (Math.floor(ports.length / 3) < process.env.MAX_SERVERS) {
    console.error("The port range is not high enough. Make sure there are 3 ports available for each server in MAX_SERVERS");
    process.exit(1);
}

let retries = 0;
let connected = false;
startSocket()
function startSocket() {
    socket = new net.Socket();
    socket.on('error', (err) => {
        console.error(`Error: ${err.message}`);
        socket.destroy();
        if (retries < 3) {
            setTimeout(() => {
                retries++;
                startSocket();
            }, 5000 + Math.round(Math.random() * 1000)/*random because when multiple nodes connect at the same time, issues occur*/)
        } else {
            setTimeout(() => {
                retries++;
                startSocket();
            }, 30000 + Math.round(Math.random() * 1000));
        }
    })
    socket.connect(process.env.PORT, process.env.IP, () => {
        connected = true;
        socket.write(
            `SETUP location:${process.env.LOCATION} ` +
            `maxServers:${process.env.MAX_SERVERS} ` +
            `maxPlayers:${process.env.MAX_PLAYERS} ` +
            `version:${JSON.parse(fs.readFileSync("./package.json")).version} ` +
            `uid:${process.env.DISCORD_ID}`
        );
        servers.length = 0;
        ports.length = 0;
        for (let i = process.env.START_PORT; i <= process.env.END_PORT; i++) {
            ports.push(i);
        }
        console.log("Connected to server");
        retries = 0;
    })
    socket.on("data", async (buffer) => {
        const data = buffer.toString("utf-8");
        console.log(data);
        if (data.startsWith("START ")) {
            if (servers.length == process.env.MAX_SERVERS) {
                socket.write("START full");
            } else if (ports.length < 3) {
                socket.write("START error1");
                console.error("The required ports are not available")
            } else {
                const currentServer = {
                    "map": data.substring(data.indexOf("map:") + 4, data.indexOf("physics:") - 1),
                    "physics": data.substring(data.indexOf("physics:") + 8, data.indexOf("id:") - 1),
                    "id": data.substring(data.indexOf("id:") + 3, data.indexOf("timeout:") - 1),
                    "timeout": Number(data.substring(data.indexOf("timeout:") + 8, data.indexOf("name:") - 1)),
                    "name": data.substring(data.indexOf("name:") + 5),
                    "ports": [ports.shift(), ports.shift(), ports.shift()],
                    "pid": undefined,
                    "server": undefined
                };
                const mapN = await setMap(currentServer.map);
                if (process.platform == "win32") {
                    currentServer.server = exec(`dcbserver_x64.exe ` +
                        `-batchmode ` +
                        `-nographics ` +
                        `-server_name:"${currentServer.name}" ` +
                        `-server_port:${currentServer.ports[0]} ` +
                        `-auth_port:${currentServer.ports[1]} ` +
                        `-query_port:${currentServer.ports[2]} ` +
                        `-server_map:${mapN} ` +
                        `-server_max_players:${process.env.MAX_PLAYERS} ` +
                        `-server_physics:${currentServer.physics} ` +
                        `-logFile "${currentServer.id}.log"`
                    )
                } else if (process.env.DOCKER == true) {
                    currentServer.server = exec(`sudo DISPLAY=:1 wine /server/dcbserver_x64.exe ` +
                        `-batchmode ` +
                        `-nographics ` +
                        `-server_name:"${currentServer.name}" ` +
                        `-server_port:${currentServer.ports[0]} ` +
                        `-auth_port:${currentServer.ports[1]} ` +
                        `-query_port:${currentServer.ports[2]} ` +
                        `-server_map:${mapN} ` +
                        `-server_max_players:${process.env.MAX_PLAYERS} ` +
                        `-server_physics:${currentServer.physics} ` +
                        `-logFile "${currentServer.id}.log"`
                    )
                } else {
                    currentServer.server = exec(`wine dcbserver_x64.exe ` +
                        `-batchmode ` +
                        `-nographics ` +
                        `-server_name:"${currentServer.name}" ` +
                        `-server_port:${currentServer.ports[0]} ` +
                        `-auth_port:${currentServer.ports[1]} ` +
                        `-query_port:${currentServer.ports[2]} ` +
                        `-server_map:${mapN} ` +
                        `-server_max_players:${process.env.MAX_PLAYERS} ` +
                        `-server_physics:${currentServer.physics} ` +
                        `-logFile "${currentServer.id}.log"`
                    )
                }
                currentServer.server.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });
                currentServer.pid = currentServer.server.pid + 1;
                //*/

                servers.push(currentServer);
                setTimeout(() => {
                    if (fs.existsSync('_DefaultMaps/Canyon2'))
                        fs.rmSync('_DefaultMaps/Canyon2', { recursive: true })
                    // fs.mkdirSync('_DefaultMaps/Canyon_2')
                }, 240000);

                let inactive = 0
                setInterval(async function () {
                    let index = -1;
                    for (let i = 0; i < servers.length; i++) {
                        if (servers[i] == currentServer) { index = i; }
                    }
                    //console.log('inactive index:', index,'players:', await currentPlayers(currentServer.id));
                    if (index == -1) {
                        clearInterval(this);
                        return;
                    }
                    if (await currentPlayers(currentServer.id) <= 0) {
                        inactive++;
                        //console.log(inactive)
                        if (inactive == 20) {
                            socket.write("CLOSE inactive:" + currentServer.id);
                            killServer(currentServer.id);
                            clearInterval(this);
                            return;
                        }
                    } else {
                        inactive = 0
                    }
                }, 60 * 1000);
                setTimeout(() => {
                    //console.log('warn')
                    let index = -1;
                    for (let i = 0; i < servers.length; i++) {
                        if (servers[i] == currentServer) { index = i; }
                    }
                    if (index == -1) { return; }
                    socket.write("CLOSE warn:" + currentServer.id);
                    return;
                }, (currentServer.timeout * 60000 * 60) - 600000);
                setTimeout(() => {
                    //console.log('timeout')
                    let index = -1;
                    for (let i = 0; i < servers.length; i++) {
                        if (servers[i] == currentServer) { index = i; }
                    }
                    if (index == -1) { return; }
                    socket.write("CLOSE timeout:" + currentServer.id);
                    killServer(currentServer.id);
                    return;
                }, currentServer.timeout * 60000 * 60);

                socket.write("START started");
                return;
            }
        } else if (data == "AVAILABLE") {
            socket.write("AVAILABLE " + (process.env.MAX_SERVERS - servers.length));
        } else if (data.startsWith("CLOSE ")) {
            killServer(data.substring(6));
        } else if (data.startsWith("PLAYERS ")) {
            //  socket.write("AVAILABLE " + (process.env.MAX_SERVERS - servers.length));
            socket.write("PLAYERS " + await currentPlayers(data.substring(8)));
            //socket.write("PLAYERS " + Math.floor(Math.random() * 10));
        } else if (data == "ALREADY_EXISTS") {
            console.error("There is already a node connected from this region with this username. Check if you already have a node running from this region, or if the region name is correct.");
            process.exit(1);
        }
        else if (data.startsWith("INVALID_VERSION:")) {
            console.error("This node is outdated. The server is running on version", data.substring(16) + ". This node is on version", JSON.parse(fs.readFileSync("./package.json")).version);
            process.exit(1);
        }
        else if (data == "INVALID_USER_ID") {
            console.error("Your Discord User ID is invalid.");
            process.exit(1);
        }
    })


    socket.on("end", () => {
        connected = false;
        console.log('ended');
        startSocket();
    })
}

async function currentPlayers(id) {
    try {
        let log = fs.readFileSync(id + ".log").toString();
        let joined = (log.match(/CLIENT_LIDGREN_CONNECT/g) || []).length;
        if (joined == null) { joined = 0 };
        let left = (log.match(/Client disabled/g) || []).length;
        if (left == null) { left = 0 };
        return joined - left;
    } catch (e) { console.log(e) }
}

function unixTime() {
    try {
        return Math.round(Date.now() / 1000)
    } catch (e) { console.log(e) }
}

function killServer(id) {
    try {
        for (let i = 0; i < servers.length; i++) {
            if (id == servers[i].id) {

                treeKill(servers[i].server.pid);
                //servers[i].server.kill();
                ports.push(...servers[i].ports);
                servers.splice(i, 1);
                //console.log(servers)
            }
        }
    } catch (e) { console.log(e) }
}

async function setMap(map) {
    try {
        for (var i = 0; i < 11; i++) {
            if (map == maps[i] && i >= 4) {
                return i + 1;
            } else if (map == maps[i]) {
                return i
            }
        }
        //fs.renameSync('_DefaultMaps/' + map, '_DefaultMaps/Canyon2')
        return new Promise((resolve, reject) => {
            fs.cpSync('maps/' + map, '_DefaultMaps/Canyon2', { recursive: true })
            //        setTimeout(()=>{
            resolve(4);
            //      }, 5000);
        });
    } catch (e) { console.log(e) }
}
