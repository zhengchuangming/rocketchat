import s from 'underscore.string';

function fetchRooms(userId, rooms) {
	if (!RocketChat.settings.get('Store_Last_Message') || RocketChat.authz.hasPermission(userId, 'preview-c-room')) {
		return rooms;
	}

	return rooms.map((room) => {
		delete room.lastMessage;
		return room;
	});
}
//123qwe123qwe
//Get Users and Rooms by UserId and searchType( for user/channel_popup_menu)
Meteor.methods({
	spotlight(text, usernames, type = { users: true, rooms: true }, rid) {
		const searchForChannels = text[0] === '#';
		const searchForDMs = text[0] === '@';
		if (searchForChannels) {
			type.users = false;
			text = text.slice(1);
		}
		if (searchForDMs) {
			type.rooms = false;
			text = text.slice(1);
		}
		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');
		const result = {
			users: [],
			rooms: [],
		};
		const roomOptions = {
			limit: 5,
			fields: {
				t: 1,
				name: 1,
				lastMessage: 1,
			},
			sort: {
				name: 1,
			},
		};
		const { userId } = this;
		if (userId == null) {
			if (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
				result.rooms = fetchRooms(userId, RocketChat.models.Rooms.findByNameAndTypeNotDefault(regex, 'c', roomOptions).fetch());
			}
			return result;
		}
		const userOptions = {
			limit: 5,
			fields: {
				username: 1,
				name: 1,
				status: 1,
				roles:1,
			},
			sort: {},
		};
		if (RocketChat.settings.get('UI_Use_Real_Name')) {
			userOptions.sort.name = 1;
		} else {
			userOptions.sort.username = 1;
		}

console.log("=============== User Search by spotlight(User,channel PopupMenu) ==============  123qwe123qwe/UserId:",userId);

        const userInfo= RocketChat.models.Users.findOneById(userId);
		if (RocketChat.authz.hasPermission(userId, 'view-outside-room')) {
			//loading users except for admin and siteManager
			if (type.users === true && RocketChat.authz.hasPermission(userId, 'view-d-room')) {

                let resultUsers = RocketChat.models.Users.findByActiveUsersExcept(text, usernames, userOptions).fetch();
                let filteredUsers = [];

                if(userInfo.roles.toString().indexOf('admin') > -1)
                    filteredUsers = resultUsers;
				else if(userInfo.roles.toString().indexOf('SiteManager') > -1){
                    resultUsers.forEach(function (record) {
                        if(!record.roles.toString().indexOf('admin') > -1)
                            filteredUsers.push(record);
                    });
				}else{
                    resultUsers.forEach(function (record) {
                        if(!(record.roles.toString().indexOf('admin') > -1) && !(record.roles.toString().indexOf('SiteManager') > -1))
                            filteredUsers.push(record);
                    });
				}
                result.users = filteredUsers;
		//     result.users = RocketChat.models.Users.findByActiveUsersExceptAndSiteId(siteKey,text, usernames, userOptions).fetch();
			}

			if (type.rooms === true && RocketChat.authz.hasPermission(userId, 'view-c-room')) {
				const searchableRoomTypes = Object.entries(RocketChat.roomTypes.roomTypes)
					.filter((roomType) => roomType[1].includeInRoomSearch())
					.map((roomType) => roomType[0]);

				const roomIds = RocketChat.models.Subscriptions.findByUserIdAndTypes(userId, searchableRoomTypes, { fields: { rid: 1 } }).fetch().map((s) => s.rid);
                // if(userInfo.roles.toString().indexOf('admin') > 0)
				// 	result.rooms = fetchRooms(userId, RocketChat.models.Rooms.findByNameAndTypesNotInIds(regex, searchableRoomTypes, roomIds, roomOptions).fetch());
				// else
                    result.rooms = fetchRooms(userId, RocketChat.models.Rooms.findByNameAndTypesNotInIdsAndSiteKey(userInfo.siteKey,regex, searchableRoomTypes, roomIds, roomOptions).fetch());
			}

		} else if (type.users === true && rid) {
			const subscriptions = RocketChat.models.Subscriptions.find({
				rid, 'u.username': {
					$regex: regex,
					$nin: [...usernames, Meteor.user().username],
				},
			}, { limit: userOptions.limit }).fetch().map(({ u }) => u._id);
			result.users = RocketChat.models.Users.find({ _id: { $in: subscriptions } }, {
				fields: userOptions.fields,
				sort: userOptions.sort,
			}).fetch();
		}
		return result;
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'spotlight',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);
