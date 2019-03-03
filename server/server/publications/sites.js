import _ from 'underscore';

Meteor.publish('getSites', function(filter,limit) {
	// console.log("publish('getOneSite')==");
	// const query = {'_id':url};
	if (!this.userId) {
		return this.ready();
	}
	const result = RocketChat.models.Sites.findFullSiteData(filter,limit);

	if (!result) {
		return this.ready();
	}
	return result;
});
