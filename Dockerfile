FROM scottyhardy/docker-wine:latest

WORKDIR /
RUN apt-get update -y && \
	apt-get install -y xvfb curl
#RUN sudo apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh && \
	sudo -E bash nodesource_setup.sh && \
	apt-get install -y nodejs


WORKDIR /server
COPY node/package.json /server/package.json
RUN npm install

COPY node/index.js /server/index.tmp
# disables dotenv. only do this if the first line is `require('dotenv').config();`
RUN tail -n +2 /server/index.tmp > /server/index.js && rm /server/index.tmp

COPY docker-node/server /server
RUN chmod gou+x /server/startup.sh


EXPOSE 27015/udp
EXPOSE 27016/udp
EXPOSE 27017/udp

# the ip of the server you are connecting to
ENV IP=
# the port of the server you are connecting to
ENV PORT=59898

# your discord user id (if you can't find this, ask someone for it)
ENV DISCORD_ID=
# the region that you are hosting your server from (maximum length 40)
ENV LOCATION=
# number between 5 and 50, recommended 10 or greater
ENV MAX_PLAYERS=10
# number greater than 0
ENV MAX_SERVERS=2
# the lower port in your range
ENV START_PORT=27015
# the higher port in your range. Make sure that you have 3 ports available for each server in MAX_SERVERS
ENV END_PORT=27020
# The query port cannot be below 27017, or the server will not be recognized. Having the start port at 27015 makes the first query port 27017, so it is fine.
# The only ports that matter are the external facing ports, so you can change this to whatever if you know what you are doing.

ENV DOCKER=true

#CMD Xvfb :1 -screen 0 1024x768x16 
#CMD ["node","."]
ENTRYPOINT ["/server/startup.sh"]
#CMD Xvfb :1 -screen 0 1024x768x16 & \
#	sleep 2 && \
#	DISPLAY=:1 wine /server/dcbserver_x64.exe -batchmode -nographics -logFile dcbserver.log -server_name:"tEST" -server_port:5998 -auth_port:8766 -query_port:27017 -server_map:3 -server_max_players:50 -server_physics:1
#ENTRYPOINT ["/usr/bin/entrypoint"]
