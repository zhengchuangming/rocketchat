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

		//=========== create generalRoom with siteKey ==============
        const now = new Date();
        let room = Object.assign({
            name: 'general',
            fname: 'general',
            t: 'c',
            msgs: 0,
            usersCount: 0,
            site_id:siteKeyData.site_id,
            siteKey:siteKeyData.key,
            siteKeyName:siteKeyData.memo,
            ts: now,
        });
        room = RocketChat.models.Rooms.createWithFullRoomData(room);
        console.log("++++++++  roomId  +++++++++: ",room._id);

        //========= insert siteKey =============

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

		var ret;

        //1. remove all messages of all users in siteKey
        let rooms = RocketChat.models.Rooms.find({'siteKey':key}).fetch();

        rooms.forEach(function (roomItem) {
            ret = RocketChat.models.Messages.removeByRoomId(roomItem._id);
        });

        //2. remove all subscriptions in site
        ret &= RocketChat.models.Subscriptions.removeBySiteKey(key);

        //3. remove all rooms in site
        ret &= RocketChat.models.Rooms.removeBySiteKey(key);

        //4. remove siteKey
        ret &= RocketChat.models.SiteKeys.removeOneSiteKey(key);

        return ret;
    },
});
