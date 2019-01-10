import _ from 'underscore';
import s from 'underscore.string';

class ModelSiteKeys extends RocketChat.models._Base {
	constructor(...args) {
		super(...args);
		this.tryEnsureIndex({ default: 1 });
		this.tryEnsureIndex({ t: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
	}

	IsExistSiteKey(key) {
		console.log("IsExistSiteKey(key) {");
		const query = {'key':key};
		const siteKeyInfo = this.findOne(query);
		if(siteKeyInfo && siteKeyInfo.length != 0)
			return true;
		else
			return false;
	}
	IsEnableSiteKey(siteUrl,key){
        const query = {'key':key};
        const siteKeyInfo = this.findOne(query);
        console.log("siteKeyInfo============:",siteKeyInfo);
        if(siteKeyInfo && siteKeyInfo.length != 0 && siteKeyInfo.status == true && siteKeyInfo.site_id == siteUrl)
           	return true;
		else
        	return false;
	}
	updateOneSiteKey(siteKeyData){
		let siteKeyInfo = this.findOne({'key':siteKeyData.key});
		if(siteKeyInfo) {

			let query = {
				site_id:siteKeyData.site_id,
				memo:siteKeyData.memo,
			};

            let duplicatedInfo = this.findOne(query);
			if(duplicatedInfo)
				return "duplicated";

			query = {'key':siteKeyData.key};
            const update = {
                $set:{
					status: siteKeyData.status,
					memo: siteKeyData.memo,
            	}
            };
            return this.update(query,update);
        }
        return -1;
	}
	enableOneSiteKey(key){
        return this.update(
            {key: key},
            {$set: {status: true, updated: true}},
            {upsert: false, multi: true}
        )
	}
	insertOneSiteKey(siteKeyData){
		const query = {
            $or: [{
                key: siteKeyData.key,
            }, {
                site_id: siteKeyData.site_id,
				memo : siteKeyData.memo,
            }],
		};

		if(this.findOne(query)) {
			return "duplicated";
		}else {
			let resultValue= this.insert(siteKeyData);
			console.log("resultValue:",resultValue);
			return true;
		}
	}
    removeOneSiteKey(key){
        const query = {
            key: key,
        };
		return this.remove(query);
    }
    findFullSiteKeyData(filter,limit,status,siteUrl){

        const siteKeyReg = new RegExp(s.escapeRegExp(filter), 'i');
        var query = "";
        if(siteUrl) {
            if (status == 'true')	//gettting if status is true
                query = {key: siteKeyReg, status: true, site_id: siteUrl};
            else
                query = {key: siteKeyReg, site_id: siteUrl};
        }else{
            if (status == 'true')	//gettting if status is true
                query = {key: siteKeyReg, status: true};
            else
                query = {key: siteKeyReg};
		}

		return this.find(query, { sort: { default: -1, site_id : 1 } });
	}
}

RocketChat.models.SiteKeys = new ModelSiteKeys('sitekeys', true);
