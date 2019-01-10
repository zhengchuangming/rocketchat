import s from 'underscore.string';
import { Email } from 'meteor/email'
import { Random } from 'meteor/random'
Meteor.methods({
    getKpi(termKind){
        if (!Meteor.userId()) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'isExistSiteKey' });
        }
        const userInfo = RocketChat.models.Users.findOne({'_id':Meteor.userId()});

        var kpiData;
        var userCounts = 0;
        var userOnlineCounts = 0;
        var roomCounts = 0;
        var messageCounts = 0;
        var siteKeyCounts = 0;
        var siteCounts = 0;
        var banCounts = 0;
        var kpiTimelineData;
        var userCountBySiteKey;

        if(userInfo.roles.toString().indexOf("admin") > -1) {
            roomCounts = RocketChat.models.Rooms.find().count();
            messageCounts = RocketChat.models.Messages.find().count();
            userOnlineCounts = RocketChat.models.Users.find({status:'online'}).count();
            userCounts = RocketChat.models.Users.find().count();
            siteCounts = RocketChat.models.Sites.find({status:true}).count();
            siteKeyCounts = RocketChat.models.SiteKeys.find({status:true}).count();
            banCounts = RocketChat.models.ReportMessages.find().count();
            //Kpi Timeline Data
            var kpiDataArray = RocketChat.models.Kpi.findKpi("day");
            kpiTimelineData = JSON.stringify(kpiDataArray);

        }else{
            userCounts = RocketChat.models.Subscriptions.getUserCountOfSite(userInfo.site_id);
            userOnlineCounts = RocketChat.models.Subscriptions.getOnlineUserCountOfSite(userInfo.site_id);
            roomCounts = RocketChat.models.Rooms.find({'site_id':userInfo.site_id}).count();
            const site_keys = RocketChat.models.SiteKeys.find({'site_id':userInfo.site_id}, {fields: {'key': 1}}).fetch();
            site_keys.forEach(function (item) {
                messageCounts += RocketChat.models.Messages.getMessageCountInSiteKey(item.key);
            });
            siteKeyCounts = RocketChat.models.SiteKeys.find({status:true,site_id:userInfo.site_id}).count();

            //Kpi Timeline Data
            var kpiDataArray = RocketChat.models.Kpi.findKpiBySiteUrl("day",userInfo.site_id);
            kpiTimelineData = JSON.stringify(kpiDataArray);

            //User Count by siteKey
            var item1 = 0, item2 = 0;

            var siteKey_userCountArray = new Array();

            siteKey_userCountArray.push(['日付', 'ユーザ数', 'オンラインで']);

            site_keys.forEach(function (item) {

                item1 = RocketChat.models.Subscriptions.getUserCountOfSiteKey(item.key);
                item2 = RocketChat.models.Subscriptions.getOnlineUserCountOfSiteKey(item.key);
                siteKey_userCountArray.push([item.key,item1,item2]);
            });

            userCountBySiteKey = JSON.stringify(siteKey_userCountArray);
        }

        kpiData = {'userCount':userCounts ,
            'userOnlineCount':userOnlineCounts,
            'messageCount':messageCounts,
            'roomCount':roomCounts,
            'siteCount':siteCounts,
            'siteKeyCount':siteKeyCounts,
            'banCount':banCounts,
            'kpiTimelineData':kpiTimelineData,
            'userCountBySiteKey':userCountBySiteKey
        };

        return kpiData;
    },
     findOpenRoomCount(siteId) {

        if (!Meteor.userId()) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'isExistSiteKey' });
        }
        const userInfo = RocketChat.models.Users.find({'_id':Meteor.userId()}).fetch();

        // if superManger
        if(userInfo.roles.toString().indexOf("admin") > -1) {

            var roomCounts = [];
            const site_keys = RocketChat.models.SiteKeys.findBySiteId(siteId, {fields: {'key': 1}}).fetch();
            site_keys.forEach(function (item) {
                var query = {
                    siteKey: item.key,
                    open: true,
                };
                var count = this.find(query, options).count();
                roomCounts.push(count);

            });

        }else{

            const site_ids = RocketChat.models.Sites.findSiteKey({fields: {'_id': 1}}).fetch();
            site_ids.forEach(function (item) {
                var count = 0;
                const site_keys = RocketChat.models.SiteKeys.findBySiteId(item._id, {fields: {'key': 1}}).fetch();
                site_keys.forEach(function (item) {
                    var query = {
                        siteKey: item.key,
                        open:true,
                    };
                    count += this.find(query, options).count();


                });
                roomCounts.push(count);
            });

        }

        return roomCounts;

    },

});
