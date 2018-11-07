import s from 'underscore.string';
import { Email } from 'meteor/email'
import { Random } from 'meteor/random'
Meteor.methods({

	//123qwe123qwe: add/update/remove site
	insertSite(siteData) {

		// check(siteData, Object);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateSite' });
		}
        siteData.key = Random.id();
		return RocketChat.models.Sites.insertOneSite(siteData);
	},
	updateSite(siteData) {

		// check(siteData, Object);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateSite' });
		}

		return RocketChat.models.Sites.updateOneSite(siteData);
	},
    validSiteManager(siteManagerKey){
	    var ret;
        const siteInfo = RocketChat.models.Sites.findOne({'key':siteManagerKey});
        console.log("siteInfo:",siteInfo);
        console.log("siteInfo_id:",siteInfo._id);

        if(siteInfo) {
            const siteManagerInfo = RocketChat.models.Users.find({'site_id':siteInfo._id}).fetch();
            console.log("siteManagerInfo:",siteManagerInfo);
            if (siteManagerInfo.length == 0)
                ret = {'siteUrl': siteInfo._id};
            else
                ret = {'result': '0'}; //siteManager is already registered!
        } else
            ret = {'result': '1'}; //  site is not registered!

        return ret;
    },
	inviteSiteManager(siteUrl){
		const siteInfo = RocketChat.models.Sites.findOne({'_id':siteUrl});

        const smtp = {
            username: 'kingstar19881213',   // eg: server@gentlenode.com
            password: '123qwe123qwe',   // eg: 3eeP1gtizk5eziohfervU
            server:   'em9265.johnsmith',  // eg: mail.gandi.net
            port: 534
        }

        process.env.MAIL_URL = 'smtps://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;
        // process.env.MAIL_URL = "smtp://kingstar19881213:123qwe123@smtp.gmail.com:587/";
        this.unblock();
        const toEmailAddress = "johnsmith19890610@outlook.com";
        const fromEmailAddress = "kingstar19881213@gmail.com";
        const subject = "TestMessage";
        const content = "You are Ok";
        // Email.send({toEmailAddress,fromEmailAddress,subject,content});
        // console.log("unique Key:",Random.id());
	},
    deleteSite(siteUrl) {
		//123qwe123qwe : remove all in site (controller)
        // check(siteData, Object);
        if (!Meteor.userId()) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'removeSite' });
        }
        var AllUsers = RocketChat.models.Users.findBySiteUrl(siteUrl).fetch();

		var ret;
		AllUsers.forEach(function (record) {
			var UserId = record._id;
            //1. remove all messages of all users in site
            ret =  RocketChat.models.Messages.removeByUserId(UserId);

            //2. remove all subscriptions of all users in site
            ret &= RocketChat.models.Subscriptions.removeByUserId(UserId);

            //3. remove all rooms which involves all users in site
            ret &= RocketChat.models.Rooms.removeByUserId(UserId);
        });

        //4. remove all users in site
        ret &= RocketChat.models.Users.removeBySiteUrl(siteUrl);

        //5. remove site finally

        ret &= RocketChat.models.Sites.removeOneSite(siteUrl);

        return ret;
    },
});
