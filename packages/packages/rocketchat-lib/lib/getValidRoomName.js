import s from 'underscore.string';
// ============= check roomName =============== 123qwe123qwe
RocketChat.getValidRoomName = function getValidRoomName(displayName, rid = '',siteKey='') {
	let slugifiedName = displayName;
	console.log("========== getValidRoomName ===========");
	if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
		const room = RocketChat.models.Rooms.findOneByDisplayNameAndSiteKey(displayName,siteKey);
		if (room && room._id !== rid) {
			if (room.archived) {
				throw new Meteor.Error('error-archived-duplicate-name', `There's an archived channel with name ${ displayName }`, { function: 'RocketChat.getValidRoomName', channel_name: displayName });
			} else {
				throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${ displayName }' exists`, { function: 'RocketChat.getValidRoomName', channel_name: displayName });
			}
		}
		slugifiedName = s.slugify(displayName);
	}

	let nameValidation;
	try {
		nameValidation = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}
	if (!nameValidation.test(slugifiedName)) {
		throw new Meteor.Error('error-invalid-room-name', `${ slugifiedName } is not a valid room name.`, {
			function: 'RocketChat.getValidRoomName',
			channel_name: slugifiedName,
		});
	}

	const room = RocketChat.models.Rooms.findOneByNameAndSiteKey(slugifiedName,siteKey);
	if (room && room._id !== rid) {
		if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
			let tmpName = slugifiedName;
			let next = 0;
			while (RocketChat.models.Rooms.findOneByNameAndNotIdAndSiteKey(tmpName, rid,siteKey)) {
				tmpName = `${ slugifiedName }-${ ++next }`;
			}
			slugifiedName = tmpName;
		} else if (room.archived) {
			throw new Meteor.Error('error-archived-duplicate-name', `There's an archived channel with name ${ slugifiedName }`, { function: 'RocketChat.getValidRoomName', channel_name: slugifiedName });
		} else {
			throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${ slugifiedName }' exists`, { function: 'RocketChat.getValidRoomName', channel_name: slugifiedName });
		}
	}

	return slugifiedName;
};
