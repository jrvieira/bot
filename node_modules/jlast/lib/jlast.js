const fs = require('fs')
const path = require('path')

module.exports = {

	load: function (file) {
		let data
		file = path.join(path.dirname(require.main.filename), file)
		try {
			data = JSON.parse(JSON.stringify(require(file)))
		} catch (e) {
			data = {}
		} finally {
			return data
		}
	},

	save: function (file, data) {
		fs.writeFile(file, JSON.stringify(data, null, '\t'), function (err, data) {
			if (err) throw err
		})
	}

}