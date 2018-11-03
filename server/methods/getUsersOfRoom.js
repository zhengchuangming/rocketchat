Meteor.methods({
	getUsersOfRoom(rid, showAll) {
		console.log("123qwe123qwe/memberusers loading");


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

		var UserSiteId = RocketChat.models.Users.findOneById(userId).site_id;

		const subscriptions = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(rid, { fields: { 'u._id': 1 } }).fetch();
		const userIds = subscriptions.map((s) => s.u._id); // TODO: CACHE: expensive
		var UserIdsInSameSite = [];
		userIds.forEach(function (item) {

			var ReadUser = RocketChat.models.Users.findOneById(item);

			if(ReadUser && ReadUser.site_id == UserSiteId && ReadUser._id != userId)
				UserIdsInSameSite.push(ReadUser._id);

		});
		const options = { fields: { username: 1, name: 1 } };

		const users = showAll === true
			? RocketChat.models.Users.findUsersWithUsernameByIds(UserIdsInSameSite, options).fetch()
			: RocketChat.models.Users.findUsersWithUsernameByIdsNotOffline(UserIdsInSameSite, options).fetch();

		return {
			total: UserIdsInSameSite.length,
			records: users,
		};
	},
});
