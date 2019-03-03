RocketChat.addUserToRoom = function(rid, user, inviter, silenced) {
	const now = new Date();
	const room = RocketChat.models.Rooms.findOneById(rid);

	// Check if user is already in room
	const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);

	if (subscription) {
        if(user.roles.includes('admin') || user.roles.includes('SiteManager'))
            RocketChat.models.Subscriptions.updatewithRoomAndUser(rid, user._id);
		return;
	}

	if (room.t === 'c' || room.t === 'p') {
		RocketChat.callbacks.run('beforeJoinRoom', user, room);
	}
	// if direct room, set room name ===========sgs
	if(room.t === 'd'){
		room.name = room.usernames[0];
		room.fname = room.usernames[0];
	}

	const muted = room.ro && !RocketChat.authz.hasPermission(user._id, 'post-readonly');
	if (muted) {
		RocketChat.models.Rooms.muteUsernameByRoomId(rid, user.username);
	}

	RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
		ts: now,
		open: true,
		alert: true,
		unread: 1,
		userMentions: 1,
		groupMentions: 0,
	});
	//if manager or SiteManager, don't make a message
	if(user.roles.includes('admin') || user.roles.includes('SiteManager')){
		return true;
	}

	if (!silenced) {
		if (inviter) {
			RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rid, user, {
				ts: now,
				u: {
					_id: inviter._id,
					username: inviter.username,
				},
			});
		} else {
			RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rid, user, { ts: now });
		}
	}

	if (room.t === 'c' || room.t === 'p') {
		Meteor.defer(function() {
			RocketChat.callbacks.run('afterJoinRoom', user, room);
		});
	}

	return true;
};
