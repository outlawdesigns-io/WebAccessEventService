FROM node:22
WORKDIR /usr/src/app/
RUN mkdir /log
COPY . .
RUN npm install
CMD ["/bin/sh","-c","npm start > /log/webaccessevents.log"]
