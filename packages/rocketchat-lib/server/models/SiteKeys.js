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
	IsEnableSiteKey(key){
        const query = {'key':key};
        const siteKeyInfo = this.findOne(query);
        if(siteKeyInfo && siteKeyInfo.length != 0 && siteKeyInfo.status == true)
           	return true;
		else
        	return false;
	}
	updateOneSiteKey(siteKeyData){
		let siteKeyInfo = this.findOne({'key':siteKeyData.key});
		if(siteKeyInfo) {
			const query = {'key':siteKeyData.key};
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
			key: siteKeyData.key,
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
    findFullSiteKeyData(filter,limit,status){

        const siteKeyReg = new RegExp(s.escapeRegExp(filter), 'i');
        var query = "";
        if(status == 'true')	//gettting if status is true
            query = {key:siteKeyReg,status:true};
        else
            query = {key:siteKeyReg};
		return this.find(query, {limit:limit});
	}
}

RocketChat.models.SiteKeys = new ModelSiteKeys('sitekeys', true);
