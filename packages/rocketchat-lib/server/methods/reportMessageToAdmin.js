import moment from 'moment';

Meteor.methods({
	reportMessageToAdmin(message) {
		console.log("reportMessageToAdmin!!!!!");
		check(message, Match.ObjectIncluding({
			_id: String,
		}));
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteMessage',
			});
		}
		const originalMessage = RocketChat.models.Messages.findOneById(message._id);
		if (originalMessage == null) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'deleteMessage',
				action: 'Delete_message',
			});
		}

        if(RocketChat.models.ReportMessages.IsExistReportMessage(originalMessage._id))
        	return 'duplicate';

		const reportedUser = RocketChat.models.Users.findOneById(originalMessage.u._id);

        const reportUser = RocketChat.models.Users.findOneById(Meteor.userId());

        const room = RocketChat.models.Rooms.findOne({'_id':originalMessage.rid});

        const siteKeyInfo = RocketChat.models.SiteKeys.findOne({'key':room.siteKey});

        let roomName = '';
        if(!room.name)
        	roomName = room.usernames[0] + "-" + room.usernames[1];
		else
			roomName = room.name;
        let reportMessage = {
        	reportUser:{
                _id:reportUser._id,
            	username:reportUser.username,
			},
			reportedUser:{
				_id:reportedUser._id,
				username:reportedUser.username,
			},
            room:{
                _id:room._id,
                name:roomName,
            },
            siteKey:{
                key:siteKeyInfo.key,
                memo:siteKeyInfo.memo,
            },
            reportMessage:{
                _id:originalMessage._id,
                description:originalMessage.msg,
            },
			site_id:siteKeyInfo.site_id,
			_updatedAt:new Date(),
		};

		return RocketChat.models.ReportMessages.insertMessage(reportMessage);
	},
});
