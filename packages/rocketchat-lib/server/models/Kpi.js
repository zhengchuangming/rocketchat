import _ from 'underscore';
import s from 'underscore.string';

class ModelKpi extends RocketChat.models._Base {
	constructor(...args) {
		super(...args);
		this.tryEnsureIndex({ default: 1 });
		this.tryEnsureIndex({ t: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
	}


	insertKpi(kpiData){
		return this.insert(kpiData);
	}
    removeKpi(registerTime){
        const query = {
            regTime: registerTime,
        };
		return this.remove(query);
    }

    findKpi(termKind){

        var curDate = new Date();

        var query = "";
        // const siteKeyReg = new RegExp(s.escapeRegExp(filter), 'i');

        if(termKind == "day"){
            var prevDate = new Date (
                curDate.getFullYear(),
                curDate.getMonth(),
                (curDate.getDate()-10));

            return this._db.model.aggregate([
                {$project: {userCount: 1,onlineUserCount:1,roomCount:1,messageCount:1,dateFormat:{$dateToString:{format:"%Y-%m-%d",date:"$regDate"}}, regDate:1,}},

                {
                    $match:{regDate: {
                                $gte: prevDate,
                                $lt: curDate,
                            }
                        }
                },

                { $sort: { default: -1, regDate : 1 } },

                {
                    $group : {_id: "$dateFormat",
                        userCount: { $sum: "$userCount"},
                        onlineUserCount: { $sum: "$onlineUserCount"},
                        roomCount: { $sum: "$roomCount"},
                        messageCount: { $sum: "$messageCount"},
                        count: { $sum: 1 }
                    },
                },
            ]);

        }else{
            var year = curDate.getFullYear();
            return this._db.model.aggregate([

                {$project: {userCount: 1,onlineUserCount:1,roomCount:1,site_id:1, year: {$year: '$regDate'},regDate:1,}},

                {
                    $match:{"site_id":siteUrl,"year":year}
                },
                {
                    $group : {_id: {$month: "$regDate"},
                        userCount: { $sum: "$userCount"},
                        onlineUserCount: { $sum: "$onlineUserCount"},
                        roomCount: { $sum: "$roomCount"},
                        count: { $sum: 1 }
                    },
                },
            ]);
        }

    }


    findKpiBySiteUrl(termKind,siteUrl){

        var curDate = new Date();

        var query = "";
        // const siteKeyReg = new RegExp(s.escapeRegExp(filter), 'i');

        if(termKind == "day"){
            var prevDate = new Date (
                curDate.getFullYear(),
                curDate.getMonth(),
                (curDate.getDate()-10));
            query = {regDate: {
                    $gte: prevDate,
                    $lt: curDate,
                }, site_id:siteUrl};
            return this.find(query, { sort: { default: -1, regDate : 1 } }).fetch();
        }else{
            var year = curDate.getFullYear();
            return this._db.model.aggregate([

                {$project: {userCount: 1,onlineUserCount:1,roomCount:1,site_id:1, year: {$year: '$regDate'},regDate:1,}},

                {
                    $match:{"site_id":siteUrl,"year":year}
                },
                {
                    $group : {_id: {$month: "$regDate"},
                              totalUserCount: { $sum: "$userCount"},
                              totalOnlineUserCount: { $sum: "$onlineUserCount"},
                              totalRoomCount: { $sum: "$roomCount"},
                              count: { $sum: 1 }
                            },
                },
            ]);
        }

	}
}

RocketChat.models.Kpi = new ModelKpi('kpi', true);
