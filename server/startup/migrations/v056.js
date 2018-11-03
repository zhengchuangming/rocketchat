RocketChat.Migrations.add({
	version: 56,
	up() {
		console.log("RocketChat.models.Messages.find({ _id: /\\./ }).forEach(function(message) {");
		RocketChat.models.Messages.find({ _id: /\./ }).forEach(function(message) {
			const oldId = message._id;
			message._id = message._id.replace(/(.*)\.S?(.*)/, 'slack-$1-$2');
			RocketChat.models.Messages.insert(message);
			RocketChat.models.Messages.remove({ _id: oldId });
		});
	},
});
