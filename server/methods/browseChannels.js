import s from 'underscore.string';

const sortChannels = function(field, direction) {
	switch (field) {
		case 'createdAt':
			return {
				ts: direction === 'asc' ? 1 : -1,
			};
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

const sortUsers = function(field, direction) {
	switch (field) {
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

Meteor.methods({
	//123qwe123qwe / user and channel search in directory
	browseChannels({ text = '', type = 'channels', sortBy = 'name', sortDirection = 'asc', page, offset, limit = 10 }) {
		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');

		if (!['channels', 'users'].includes(type)) {
			return;
		}

		if (!['asc', 'desc'].includes(sortDirection)) {
			return;
		}

		if ((!page && page !== 0) && (!offset && offset !== 0)) {
			return;
		}

		if (!['name', 'createdAt', 'usersCount', ...type === 'channels' ? ['usernames'] : [], ...type === 'users' ? ['username'] : []].includes(sortBy)) {
			return;
		}

		const skip = Math.max(0, offset || (page > -1 ? limit * page : 0));

		limit = limit > 0 ? limit : 10;

		const options = {
			skip,
			limit,
		};

		const user = Meteor.user();
	 console.log("=========== browseChannels(channel/user browser) =============/123qwe123qwe");
		var siteKey ;
		if(user) {

			const UserInfo = RocketChat.models.Users.findOneById(user._id);

		// if superManager
		// search by Name(old)
        //     if(UserInfo.roles.toString().indexOf('admin') > 0){
        //         if (type === 'channels') {
        //             const sort = sortChannels(sortBy, sortDirection);
        //             if (!RocketChat.authz.hasPermission(user._id, 'view-c-room')) {
        //                 return;
        //             }
        //             return {
        //                 results: RocketChat.models.Rooms.findByName(regex).fetch(),
        //                 total: RocketChat.models.Rooms.findByName(regex).count(),
        //             };
        //         }
		//
        //         // type === users
        //         if (!RocketChat.authz.hasPermission(user._id, 'view-outside-room') || !RocketChat.authz.hasPermission(user._id, 'view-d-room')) {
        //             return;
        //         }
        //         const sort = sortUsers(sortBy, sortDirection);
        //         return {
        //             results: RocketChat.models.Users.findByActiveUsersExcept(text, [user.username], {
        //                 ...options,
        //                 sort,
        //                 fields: {
        //                     username: 1,
        //                     name: 1,
        //                     createdAt: 1,
        //                     emails: 1,
        //                 },
        //             }).fetch(),
        //             total: RocketChat.models.Users.findByActiveUsersExcept(text, [user.username]).count(),
        //         };

	  //search by name and siteKey(New)
            siteKey = UserInfo.siteKey;
            if (type === 'channels') {
                const sort = sortChannels(sortBy, sortDirection);
                if (!RocketChat.authz.hasPermission(user._id, 'view-c-room')) {
                    return;
                }
                return {
                    results: RocketChat.models.Rooms.findByNameAndSiteKey(siteKey,regex).fetch(),
                    total: RocketChat.models.Rooms.findByNameAndSiteKey(siteKey,regex).count(),
                };
            }

            // type === users
            if (!RocketChat.authz.hasPermission(user._id, 'view-outside-room') || !RocketChat.authz.hasPermission(user._id, 'view-d-room')) {
                return;
            }
            const sort = sortUsers(sortBy, sortDirection);

		//========= loading users except for admin and siteManager =========

            let resultUsers = RocketChat.models.Users.findByActiveUsersExcept(text, [user.username], {
								...options,
								sort,
								fields: {
									username: 1,
									name: 1,
									createdAt: 1,
									emails: 1,
									roles:1,
								},
							}).fetch();

            let filteredUsers = [];

            if(UserInfo.roles.toString().indexOf('admin') > -1)
                filteredUsers = resultUsers;
            else if(UserInfo.roles.toString().indexOf('SiteManager') > -1){
                resultUsers.forEach(function (record) {
                    if(!record.roles.toString().indexOf('admin') > -1)
                        filteredUsers.push(record);
                });
            }else{
                resultUsers.forEach(function (record) {
                    if(!(record.roles.toString().indexOf('admin') > -1) && !(record.roles.toString().indexOf('SiteManager') > -1))
                        filteredUsers.push(record);
                });
            }

            return {
                results: filteredUsers,
                total: filteredUsers.length,
            };

		//if not superManager(old)
        //     }else{
		//
        //         siteKey = UserInfo.siteKey;
		//
        //         if (type === 'channels') {
		//
        //             const sort = sortChannels(sortBy, sortDirection);
        //             if (!RocketChat.authz.hasPermission(user._id, 'view-c-room')) {
        //                 return;
        //             }
        //             return {
        //                 results: RocketChat.models.Rooms.findByNameAndTypeAndSiteId(siteId, regex),
        //                 total: RocketChat.models.Rooms.findByNameAndTypeAndSiteId(siteId, regex).length,
        //             };
        //         }
		//
        //         // type === users
        //         if (!RocketChat.authz.hasPermission(user._id, 'view-outside-room') || !RocketChat.authz.hasPermission(user._id, 'view-d-room')) {
        //             return;
        //         }
        //         const sort = sortUsers(sortBy, sortDirection);
        //         return {
        //             results: RocketChat.models.Users.findByActiveUsersExceptAndSiteId(siteId, text, [user.username], {
        //                 ...options,
        //                 sort,
        //                 fields: {
        //                     username: 1,
        //                     name: 1,
        //                     createdAt: 1,
        //                     emails: 1,
        //                 },
        //             }).fetch(),
        //             total: RocketChat.models.Users.findByActiveUsersExceptAndSiteId(siteId, text, [user.username]).count(),
        //         };
		// 	}
		}
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'browseChannels',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);
