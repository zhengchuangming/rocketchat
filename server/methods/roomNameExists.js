Meteor.methods({
	roomNameExists(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'roomExists',
			});
		}

		let userInfo = RocketChat.models.Users.findOne({'_id':Meteor.userId()});
		let siteKey;
		if(userInfo)
			siteKey = userInfo.siteKey;
		console.log("========= Check RoomName Exist =========");
		const room = RocketChat.models.Rooms.findOneByNameAndSiteKey(rid,siteKey);
		return !!room;
	},
});
