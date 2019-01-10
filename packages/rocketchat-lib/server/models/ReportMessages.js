import _ from 'underscore';
import s from 'underscore.string';

class ModelReportMessages extends RocketChat.models._Base {
	constructor(...args) {
		super(...args);
		this.tryEnsureIndex({ default: 1 });
		this.tryEnsureIndex({ t: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
	}

	IsExistReportMessage(msgId) {
		const query = {'reportMessage._id':msgId};
		const result = this.findOne(query);
		if(result && result.length != 0)
			return true;
		else
			return false;
	}

	insertMessage(reportMessage){
		return this.insert(reportMessage);
	}

    findFullReportMessages(filter,limit,siteUrl){
		// console.log("findUllReportMessages!====:",filter);
        const userReg = new RegExp(s.escapeRegExp(filter), 'i');
        let query = '';
        if(siteUrl) {
            query = {
                $or: [{
                    'reportUser.username': userReg,
                }, {
                    'reportedUser.username': userReg,
                }],
				site_id : siteUrl,
            };
        }else{
            query = {
                $or: [{
                    'reportUser.username': userReg,
                }, {
                    'reportedUser.username': userReg,
                }],
            };
		}
        // console.log("searchResult:",this.find(query,{limit:limit}).fetch());
		return this.find(query, {limit:limit});
	}
}

RocketChat.models.ReportMessages = new ModelReportMessages('report_messages', true);
