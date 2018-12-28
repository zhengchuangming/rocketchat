import s from 'underscore.string';
import { Email } from 'meteor/email'
import { Random } from 'meteor/random'
Meteor.methods({

	//123qwe123qwe: add/update/remove sitekey
    isExistSiteKey(siteKey){
        if (!Meteor.userId()) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'isExistSiteKey' });
        }
        return RocketChat.models.SiteKeys.IsExistSiteKey(siteKey);
    },
	insertSiteKey(siteKeyData) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertSiteKey' });
		}
		return RocketChat.models.SiteKeys.insertOneSiteKey(siteKeyData);
	},
	updateSiteKey(siteKeyData) {

		// check(siteData, Object);
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'UpdateSiteKey' });
		}

		return RocketChat.models.SiteKeys.updateOneSiteKey(siteKeyData);
	},
    validSiteKeyManager(siteKey){
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

    deleteSiteKey(key) {
		//123qwe123qwe : remove all in site (controller)
        // check(siteData, Object);
        if (!Meteor.userId()) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'removeSiteKey' });
        }
        // var AllUsers = RocketChat.models.Users.findBySiteUrl(siteUrl).fetch();
        //
		var ret;
		// AllUsers.forEach(function (record) {
		// 	var UserId = record._id;
        //     //1. remove all messages of all users in site
        //     ret =  RocketChat.models.Messages.removeByUserId(UserId);
        //
        //     //2. remove all subscriptions of all users in site
        //     ret &= RocketChat.models.Subscriptions.removeByUserId(UserId);
        //
        //     //3. remove all rooms which involves all users in site
        //     ret &= RocketChat.models.Rooms.removeByUserId(UserId);
        // });
        //
        // //4. remove all users in site
        // ret &= RocketChat.models.Users.removeBySiteUrl(key);
        //
        // //5. remove site finally

        ret &= RocketChat.models.SiteKeys.removeOneSiteKey(key);

        return ret;
    },
});
