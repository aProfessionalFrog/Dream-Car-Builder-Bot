# Dream-Car-Builder-Bot

A Discord bot that simplifies the process of starting Dream Car Builder servers.

## Overview

This project enables easy scalability for hosting Dream Car Builder (DCB) servers. It consists of two main components:
- **The Bot:** Connects to Discord via the Discord Bot API and hosts a Node.js WebSocket server.
- **The Node:** Easily deployable, it connects to the bot's WebSocket server. The bot communicates with nodes to start and stop servers.

## Dependencies

### Windows
- [Node.js 20.18.0 LTS (Windows)](https://nodejs.org/en/download/) or newer (untested with older versions)
- Dream Car Builder server

### Linux
- [Node.js 20.18.0 LTS (Linux)](https://github.com/nodesource/distributions) or newer (untested with older versions)
- [WineHQ](https://gitlab.winehq.org/wine/wine/-/wikis/Download) (tested with Wine 9.0, should work with other versions)
- Dream Car Builder server

## How to Host a Node

To host a node, follow these steps:

### 1. Download the Node Files
The node files are available in the [releases](https://github.com/aProfessionalFrog/Dream-Car-Builder-Bot/releases) section of this repository.
- Download `DCB_node.zip` and extract its contents to your Dream Car Builder server directory (usually located in `steamapps/common/DCB Server`).
    - This can be found through your Steam library: DCB Server > cog icon > Manage > Browse local files
- Download the most recent `maps.zip` file and extract the `maps` folder into your Dream Car Builder server directory
- Your `DCB Server` directory should now contain three new folders: `index.js`, `example.env`, `package.json`, and `maps`.

### 2. Configure the Node
- Edit `example.env` with the appropriate information (IP, PORT, etc.), then rename the file to `.env`.
- Run `npm install` in the command line to install dependencies:
  - **Windows:** Open Command Prompt in the current directory by typing `cmd` in the File Explorer address bar.
 

### 3. Forward Required Ports
Ensure that all necessary ports are forwarded. If unsure, search for guides on port forwarding specific to your router.

## Running the Server

1. Make sure all required ports are forwarded.
2. Start the server by running `node .` in your command line:
   - Consider creating a batch file to automate this step.
3. If the connection is successful, you should see a message: "`Connected to server`".
   - If you encounter errors such as `ECONNREFUSED` or `ETIMEDOUT`, check your `.env` settings (IP and PORT) and verify that the bot is running. Contact the bot host if issues persist.

## Docker docs coming soon