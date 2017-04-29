module.exports = (ssh, command, dir) => {
	return (callback) => {
		ssh.execCommand(command, { cwd: dir })
		.then((result) => {
			console.log(result);
		    callback(null);
	  	});
	}
}