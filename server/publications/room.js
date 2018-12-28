import _ from 'underscore';

const fields = {
	_id: 1,
	name: 1,
	fname: 1,
	t: 1,
	cl: 1,
	u: 1,
	// usernames: 1,
	topic: 1,
	announcement: 1,
	announcementDetails: 1,
	muted: 1,
	siteKey:1,
	siteKeyName:1,
	_updatedAt: 1,
	archived: 1,
	jitsiTimeout: 1,
	description: 1,
	default: 1,
	customFields: 1,
	lastMessage: 1,
	retention: 1,

	// @TODO create an API to register this fields based on room type
	livechatData: 1,
	tags: 1,
	sms: 1,
	facebook: 1,
	code: 1,
	joinCodeRequired: 1,
	open: 1,
	v: 1,
	label: 1,
	ro: 1,
	reactWhenReadOnly: 1,
	sysMes: 1,
	sentiment: 1,
	tokenpass: 1,
	streamingOptions: 1,
	broadcast: 1,
	encrypted: 1,
	e2eKeyId: 1,
};

const roomMap = (record) => {
	if (record) {
		return _.pick(record, ...Object.keys(fields));
	}
	return {};
};

Meteor.methods({
	'rooms/get'(updatedAt) {
		let options = { fields };

		if (!Meteor.userId()) {
			if (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
				return RocketChat.models.Rooms.findByDefaultAndTypes(true, ['c'], options).fetch();
			}
			return [];
		}

		this.unblock();

		options = {
			fields,
		};

        console.log("@@@@@@@@@@@@@@@@@ load all rooms of user from server @@@@@@@@@@@@@@@@@/123qwe123qwe");
        let siteKey = RocketChat.models.Users.findOne(Meteor.userId()).siteKey;

		if (updatedAt instanceof Date) {
			return {
				update: RocketChat.models.Rooms.findBySubscriptionUserIdAndSiteKeyUpdatedAfter(siteKey, Meteor.userId(), updatedAt, options).fetch(),
				remove: RocketChat.models.Rooms.trashFindDeletedAfter(updatedAt, {}, { fields: { _id: 1, _deletedAt: 1 } }).fetch(),
			};
		}

		// return RocketChat.models.Rooms.findBySubscriptionUserId(Meteor.userId(), options).fetch();
        return RocketChat.models.Rooms.findBySubscriptionUserIdAndSiteKey(siteKey, Meteor.userId(), options).fetch();
	},

	getRoomByTypeAndName(type, name) {
		const userId = Meteor.userId();

		if (!userId && RocketChat.settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomByTypeAndName' });
		}

		const roomFind = RocketChat.roomTypes.getRoomFind(type);

		let room;
        console.log("&&&&&&&&&&&&&&& getRoomByTypeAndName in server side &&&&&&&&&&&&&&&");
        let siteKey = RocketChat.models.Users.findOne(Meteor.userId()).siteKey;
		if (roomFind) {
			room = roomFind.call(this, name);
		} else {
			// room = RocketChat.models.Rooms.findByTypeAndName(type, name).fetch();
            room = RocketChat.models.Rooms.findByTypeAndNameAndSiteKey(siteKey, type, name).fetch();
		}

		if (!room || room.length === 0) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getRoomByTypeAndName' });
		}

		room = room[0];

		if (!Meteor.call('canAccessRoom', room._id, userId)) {
			throw new Meteor.Error('error-no-permission', 'No permission', { method: 'getRoomByTypeAndName' });
		}

		if (RocketChat.settings.get('Store_Last_Message') && !RocketChat.authz.hasPermission(userId, 'preview-c-room')) {
			delete room.lastMessage;
		}

		return roomMap(room);
	},
});
//123QWE123QWE\Notification Entry
RocketChat.models.Rooms.on('change', ({ clientAction, id, data }) => {
	switch (clientAction) {
		case 'updated':
		case 'inserted':
			// Override data cuz we do not publish all fields
			data = RocketChat.models.Rooms.findOneById(id, { fields });
			break;

		case 'removed':
			data = { _id: id };
			break;
	}
	if (data) {
		// if(clientAction == "updated" && id == "GENERAL"){
		// 	console.log("I inform that General Room is Updated!");
		// 	// ============== when room is updated, start of all actions ================ 123qw123qwe
		// 		if(data.lastMessage) {
		// 				console.log("data.lastMessage.u._id:",data.lastMessage.u._id);
		//
		// 				var WriteUserSiteId = RocketChat.models.Users.findOneById(data.lastMessage.u._id).site_id;
		//
		// 				RocketChat.models.Subscriptions.findByRoomId(id, {fields: {'u._id': 1}}).forEach(({u}) => {
		//
		// 							// console.log("==========***start===============");
		// 							// console.log(u._id);
		// 						var receiveUser = RocketChat.models.Users.findOneById(u._id);
		//
		// 						if (receiveUser) {
		// 							var ReadUserSiteId = receiveUser.site_id;
		//
		// 							if (ReadUserSiteId === WriteUserSiteId)
		// 									RocketChat.Notifications.notifyUserInThisInstance(u._id, 'rooms-changed', clientAction, data);
		//
		// 						}
		//
		// 					// console.log("==========***end===============");
		//
		// 				});
		// 		}
		// }else{
        //
		//=======if lastmessage is written in direct room by manager and manager is not in the room, Don't notify
				if(data.usernames && data.lastMessage){
					const bExist = data.usernames.includes(data.lastMessage.u.username);
					if(!bExist) return;
				}

				RocketChat.models.Subscriptions.findByRoomId(id, {fields: {'u._id': 1,'siteKey':1}}).forEach((subscription) => {
                    		var receiveUser = RocketChat.models.Users.findOneById(subscription.u._id);
							if (receiveUser.siteKey == subscription.siteKey || receiveUser.roles.includes('admin') || receiveUser.roles.includes('SiteManager')) {
								console.log("======== notify users when room is changed ========:",receiveUser.username);
                                RocketChat.Notifications.notifyUserInThisInstance(subscription.u._id, 'rooms-changed', clientAction, data);
                            }
				});
		// }

	}
});
