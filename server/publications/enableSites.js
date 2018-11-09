import _ from 'underscore';

Meteor.publish('getEnableSites', function(filter,limit) {
	// console.log("publish('getOneSite')==");
	// const query = {'_id':url};
	if (!this.userId) {
		return this.ready();
	}
	console.log("Here is getEnableSites!!");
	const result = RocketChat.models.Sites.findEnableSiteData(filter,limit);

	if (!result) {
		return this.ready();
	}
	return result;
});
