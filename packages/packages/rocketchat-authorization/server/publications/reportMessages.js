Meteor.publish('reportMessages', function(filter,limit) {
	if (!this.userId) {
		return this.ready();
	}
    const UserInfo = RocketChat.models.Users.findOne({_id:this.userId});
    let siteUrl = null;
    if(UserInfo.roles.toString() == 'SiteManager')
        siteUrl = UserInfo.site_id;

	return RocketChat.models.ReportMessages.findFullReportMessages(filter,limit,siteUrl);
});
