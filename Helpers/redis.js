const redis = require('redis')
const {infoLogger,errorLogger} = require('../Utils/logger')

const client = redis.createClient({
    port: 6379,
    host: "127.0.0.1"
})

client.on('connect', () => {
    infoLogger.info("Client connect to redis")
})

client.on('ready', () => {
    infoLogger.info("Client connected to redis and ready to use")
})

client.on('error', (err) => {
    errorLogger.error(err.message)
})

client.on('end', () => {
    errorLogger.error("Client connect to redis")
})

client.on('SIGINT', () => {
    client.quit();
})

module.exports=client
