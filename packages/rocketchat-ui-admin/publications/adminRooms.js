import _ from 'underscore';
import s from 'underscore.string';

Meteor.publish('adminRooms', function(filter, types, limit) {
	if (!this.userId) {
		return this.ready();
	}
	if (RocketChat.authz.hasPermission(this.userId, 'view-room-administration') !== true) {
		return this.ready();
	}
	if (!_.isArray(types)) {
		types = [];
	}

	const options = {
		fields: {
			name: 1,
			t: 1,
			cl: 1,
			u: 1,
			usernames: 1,
			muted: 1,
			ro: 1,
			default: 1,
			topic: 1,
			msgs: 1,
			usersCount:1,
            site_id:1,
			siteKey:1,
			siteKeyName:1,
			archived: 1,
			tokenpass: 1,
		},
		limit,
		sort: {
			default: -1,
			name: 1,
		},
	};
	console.log("123qwe123qwe/publish adminRooms into client");
	var UserInfo = RocketChat.models.Users.findOneById(this.userId);
	filter = s.trim(filter);
	if(UserInfo.roles.toString().indexOf('admin') !== -1){
		if (filter && types.length) {
			// CACHE: can we stop using publications here?
			return RocketChat.models.Rooms.findByNameContainingAndTypes(filter, types, options);
		} else if (types.length) {
			// CACHE: can we stop using publications here?
			return RocketChat.models.Rooms.findByTypes(types, options);
		} else {
			// CACHE: can we stop using publications here?
			return RocketChat.models.Rooms.findByNameContaining(filter, options);
		}
	}else {

		if (filter && types.length) {
			// CACHE: can we stop using publications here?
			return RocketChat.models.Rooms.findByNameContainingAndTypes(filter, types, options);
		} else if (types.length) {
			// CACHE: can we stop using publications here?
			return RocketChat.models.Rooms.findByTypesAndSiteId(UserInfo.site_id, types, options);
		} else {
			// CACHE: can we stop using publications here?
			return RocketChat.models.Rooms.findByNameContaining(filter, options);
		}
	}
});
