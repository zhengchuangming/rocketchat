import _ from 'underscore';
import s from 'underscore.string';

class ModelSites extends RocketChat.models._Base {
	constructor(...args) {
		super(...args);
		this.tryEnsureIndex({ default: 1 });
		this.tryEnsureIndex({ t: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
	}

	createSite(url,valid) {
		const site = {
			_id:url,
			available:valid
		};

		this.insert(site);
		return site;
	}
	IsExistSite(url) {
		const query = {'_id':url};
		const siteInfo = this.findOne(query);
		if(siteInfo && siteInfo.length != 0)
			return true;
		else
			return false;
	}
	updateOneSite(siteData){
		if(this.remove(siteData._id)) {
			const site = {
				_id: siteData.changed_id,
				email: siteData.email,
				status: siteData.status,
				invite: siteData.invite,
			};
			return this.insert(site);

		}else
			return false;
	}
	insertOneSite(siteData){
		const query = {
			_id: siteData._id,
		};

		if(this.findOne(query)) {
			return "duplicated";
		}else {
			return this.insert(siteData);
		}
	}
    removeOneSite(siteUrl){
        const query = {
            _id: siteUrl,
        };
		return this.remove(query);
    }
    findFullSiteData(filter,limit,status){

        const siteUrlReg = new RegExp(s.escapeRegExp(filter), 'i');
        var query = "";
        if(status == 'true')	//gettting if status is true
            query = {_id:siteUrlReg,status:true};
        else
            query = {_id:siteUrlReg};
		return this.find(query, {limit:limit});
	}
    findEnableSiteData(filter,limit){
		console.log("Here is findEnableSiteData!!");
        const siteUrlReg = new RegExp(s.escapeRegExp(filter), 'i');
        const query = {_id:siteUrlReg,enable:true};
        return this.find(query, {limit:limit});
    }
}

RocketChat.models.Sites = new ModelSites('registered_sites', true);
