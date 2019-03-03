Meteor.methods({
	getUsersOfRoom(rid, showAll) {

	console.log("************** loading member Users ( by SiteKey ) ****************123qwe123qwe");

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		const room = Meteor.call('canAccessRoom', rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (room.broadcast && !RocketChat.authz.hasPermission(userId, 'view-broadcast-member-list', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getUsersOfRoom' });
		}

		var UserSiteKey = RocketChat.models.Users.findOneById(userId).siteKey;

		const subscriptions = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(rid, { fields: { 'u._id': 1 } }).fetch();
		const userIds = subscriptions.map((s) => s.u._id); // TODO: CACHE: expensive
		// var UserIdsInSameSite = [];
		// userIds.forEach(function (item) {
		//
		// 	var ReadUser = RocketChat.models.Users.findOneById(item);
		//
		// 	if(ReadUser && ReadUser.site_id == UserSiteId && ReadUser._id != userId)
		// 		UserIdsInSameSite.push(ReadUser._id);
		//
		// });
		const options = { fields: { username: 1, name: 1 ,siteKey:1} };

		const users = showAll === true
			? RocketChat.models.Users.findUsersWithUsernameByIds(userIds, options).fetch()
            : RocketChat.models.Users.findUsersWithUsernameByIdsNotOfflineAndSiteKey(UserSiteKey, userIds, options).fetch();
			// : RocketChat.models.Users.findUsersWithUsernameByIdsNotOffline(userIds, options).fetch();

		return {
			total: userIds.length,
			records: users,
		};
	},
});
