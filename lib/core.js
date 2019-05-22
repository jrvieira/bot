const irc = require('irc')
const $ = require('colors')
const format = require('date-fns/format')

// create the bot (autoconnect by default)

let name = process.argv[2]

const bot = module.exports = new irc.Client('irc.freenode.net', name, {
	userName: name,
	realName: name,
	port: 6667,
//	localAddress: null,
	autoConnect: true,
// debug: true,
// showErrors: true,
	autoRejoin: true,
	channels: [], // autojoin
	secure: true,
	selfSigned: true,
	certExpired: true,
	floodProtection: true,
	floodProtectionDelay: 500,
	retryCount: 0,
//	retryDelay: 2000,
//	stripColors: false,
//	channelPrefixes: '&#',
//	messageSplit: 512,
//	encoding: '',
//	sasl: true,
	password: process.argv[3]
}).on('error', function (e) {

	console.err(JSON.stringify(e))

})

// log hook

console.timestamp = function () {
	return format(Date.now(), 'YYYY MM DD HH:mm.ss')
}

// prepend date to console.info
console.info = function (...args) {
	console.log($.dim(console.timestamp()), ...args)
}
console.err = function (...args) {
	console.error($.dim(console.timestamp()), ...args)
}

// log events

let lastcommand = ''

bot.on('raw', function (msg) {

	// ignore commands
	let ignore_commands = [
		'PONG',
//		'QUIT',
//		'PART',
//		'JOIN'
	]
	// ignore_commands unless own
	if ( ignore_commands.includes(msg.command) && msg.nick !== bot.nick ) return false
	// ignore rpl_*
//	if (msg.command.startsWith('rpl_')) return false
	// ignore codes
//	if (!isNaN(msg.command)) return false
	// ChanServ welcome to channel notices
	if (msg.args && msg.args.length > 1 && msg.args[1].startsWith('[#')) return false

	// format console output
	// msg.command in red or nagenta if self
	let comm = msg.nick === bot.nick ? $.magenta(msg.command || '') : $.red(msg.command || '')
	// msg.nick in cyan
	let nick = $.cyan(msg.nick||'')
	// alternate msg.args dim
	let args = []
	msg.args.forEach(function (arg, i, arr) {
		args[i] = i % 2 ? arg : $.dim(arg)
	})
	args = args.join(' ')

	let output = msg.command.startsWith('err_') || msg.command === 'ERROR' ? console.err : console.info

	// group similar commands
	if (msg.command !== lastcommand) {

		console.info('')
		lastcommand = msg.command

		output(comm)

	}
	output(nick ? nick+' '+args : args)

	// emit COMMANDS
	bot.emit(msg.command, msg)

})

// catch bot messages & log output (group as PRIVMSG (for logging purposes))

bot.on('selfMessage', function (to, text) {
	if (lastcommand !== 'PRIVMSG') {
		console.info('')
		console.info($.magenta('PRIVMSG'))
	}
	console.info($.magenta(bot.nick), $.dim(to), text)
	lastcommand = 'PRIVMSG'
})
