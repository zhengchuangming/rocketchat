Meteor.publish('siteKeys', function(filter,limit,status) {
	if (!this.userId) {
		return this.ready();
	}
	const UserInfo = RocketChat.models.Users.findOne({_id:this.userId});
	let siteUrl = null;
	if(UserInfo.roles.toString() == 'SiteManager')
        siteUrl = UserInfo.site_id;
	return RocketChat.models.SiteKeys.findFullSiteKeyData(filter,limit,status,siteUrl);
});
