#!/usr/bin/env bash
Xvfb :1 -screen 0 1024x768x16 &
sudo --preserve-env node .
#sudo DISPLAY=:1 wine /server/dcbserver_x64.exe -batchmode -nographics -logFile dcbserver.log -server_name:"tEST" -server_port:27015 -auth_port:27016 -query_port:27017 -server_map:3 -server_max_players:50 -server_physics:1
