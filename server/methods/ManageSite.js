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
		RocketChat.models.Sites.insertOneSite(siteData);
        RocketChat.models.Rooms.createGeneralRoom(siteData._id);
	},
	updateSite(siteData) {

		// check(siteData, Object);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateSite' });
		}

        if(siteData._id != siteData.changed_id && RocketChat.models.Sites.IsExistSite(siteData.changed_id))
            return "exist";

		return RocketChat.models.Sites.updateOneSite(siteData);
	},
    validSiteManager(siteManagerKey){
	    var ret;
        const siteInfo = RocketChat.models.Sites.findOne({'key':siteManagerKey});
        console.log("siteInfo_id:",siteInfo._id);

        if(siteInfo) {
            const siteManagerInfo = RocketChat.models.Users.find({'site_id':siteInfo._id}).fetch();
            console.log("siteManagerInfo:",siteManagerInfo);
            if (siteManagerInfo.length == 0)
                ret = {'siteUrl': siteInfo._id,'email':siteInfo.email};
            else
                ret = {'result': '0'}; //siteManager is already registered!
        } else
            ret = {'result': '1'}; //  site is not registered!

        return ret;
    },
	inviteSiteManager(siteUrl){
		const siteInfo = RocketChat.models.Sites.findOne({'_id':siteUrl});

        const smtp = {
            username: 'apikey',   // eg: server@gentlenode.com
            password: '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',   // eg: 3eeP1gtizk5eziohfervU
            server:   'smtp.sendgrid.net',  // eg: mail.gandi.net
            port: 465
        }

        // process.env.MAIL_URL = 'smtps://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;
        process.env.MAIL_URL = "smtp://apikey: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@smtp.sendgrid.net:587";
        this.unblock();
        const toEmailAddress = siteInfo.email;
        const fromEmailAddress = "kingstar19881213@gmail.com";
        const subject = "Welcome to our chatting site";
        const content = "Your are invited in our chatting site. Please join in out site by clicking here  http://35.167.1.68:3000/site-register?key=" + siteInfo.key;

        Email.send({
            to: toEmailAddress,
            from: fromEmailAddress,
            subject: subject,
            text: content,
        });

        RocketChat.models.Sites.update(
            {_id: siteUrl},
            {$set: {invite : true}},
        );
        // console.log("unique Key:",Random.id());
	},
    deleteSite(siteUrl) {
		//123qwe123qwe : remove all in site (controller)
        // check(siteData, Object);
        if (!Meteor.userId()) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'removeSite' });
        }

		var ret;

        const site_keys = RocketChat.models.SiteKeys.find({'site_id':siteUrl}, {fields: {'key': 1}}).fetch();
        site_keys.forEach(function (item) {

            //1. remove all messages of all users in site
            let rooms = RocketChat.models.Rooms.find({'site_id':siteUrl}).fetch();

            rooms.forEach(function (roomItem) {
                ret = RocketChat.models.Messages.removeByRoomId(roomItem._id);
            });

            //2. remove all subscriptions in site
            ret &= RocketChat.models.Subscriptions.removeBySiteKey(item.key);
        });



        //3. remove all rooms in site
        ret &= RocketChat.models.Rooms.removeBySiteId(siteUrl);

        //4. remove all siteKey in site
        ret &= RocketChat.models.SiteKeys.removeBySiteId(siteUrl);

        //5. remove site finally

        ret &= RocketChat.models.Sites.removeOneSite(siteUrl);

        return ret;
    },
    getSiteUrlByUserId(userId){
        let userInfo =  RocketChat.models.Users.findOne({'_id':userId});
        if(userInfo.length > 0)
            return userInfo.site_id;
        else
            return '';
    }
});
