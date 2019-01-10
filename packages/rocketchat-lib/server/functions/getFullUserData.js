/* globals RocketChat */
import s from 'underscore.string';

const logger = new Logger('getFullUserData');

const defaultFields = {
	name: 1,
	username: 1,
	status: 1,
	utcOffset: 1,
	type: 1,
	active: 1,
	reason: 1,
	site_id:1,
	siteKey:1,
    roles: 1,
};

const fullFields = {
	emails: 1,
	phone: 1,
	statusConnection: 1,
	createdAt: 1,
	lastLogin: 1,
	services: 1,
	requirePasswordChange: 1,
	requirePasswordChangeReason: 1,
};

let publicCustomFields = {};
let customFields = {};

RocketChat.settings.get('Accounts_CustomFields', (key, value) => {
	publicCustomFields = {};
	customFields = {};

	if (!value.trim()) {
		return;
	}

	try {
		const customFieldsOnServer = JSON.parse(value.trim());
		Object.keys(customFieldsOnServer).forEach((key) => {
			const element = customFieldsOnServer[key];
			if (element.public) {
				publicCustomFields[`customFields.${ key }`] = 1;
			}
			customFields[`customFields.${ key }`] = 1;
		});
	} catch (e) {
		logger.warn(`The JSON specified for "Accounts_CustomFields" is invalid. The following error was thrown: ${ e }`);
	}
});

RocketChat.getFullUserData = function({ userId, filter, limit: l }) {
	const username = s.trim(filter);
	const userToRetrieveFullUserData = RocketChat.models.Users.findOneByUsername(username);
	const isMyOwnInfo = userToRetrieveFullUserData && userToRetrieveFullUserData._id === userId;
	const viewFullOtherUserInfo = RocketChat.authz.hasPermission(userId, 'view-full-other-user-info');
	const limit = !viewFullOtherUserInfo ? 1 : l;

	if (!username && limit <= 1) {
		return undefined;
	}

	const _customFields = isMyOwnInfo || viewFullOtherUserInfo ? customFields : publicCustomFields;

	const fields = viewFullOtherUserInfo ? { ...defaultFields, ...fullFields, ..._customFields } : { ...defaultFields, ..._customFields };

	const options = {
		fields,
		limit,
		sort: { site_id:-1},
	};
	// const UserInfo = RocketChat.models.Users.findOneById(userId);

	console.log("========= fullUserData loading ===========123qwe123qwe ");
	// if(UserInfo.roles.toString().indexOf('admin') > 0){
		if (!username) {
			return RocketChat.models.Users.find({}, options);
		}
		if (limit === 1) {
			return RocketChat.models.Users.findByUsername(username, options);
		}
		const usernameReg = new RegExp(s.escapeRegExp(username), 'i');
		return RocketChat.models.Users.findByUsernameNameOrEmailAddress(usernameReg, options);

	// }else {
	// 	const UserSiteId = UserInfo.site_id;
	//
	// 	if (!username) {
	// 		return RocketChat.models.Users.find({site_id: UserSiteId}, options);
	// 	}
	// 	if (limit === 1) {
	// 		return RocketChat.models.Users.findByUsernameAndSiteId(UserSiteId, username, options);
	// 	}
	// 	const usernameReg = new RegExp(s.escapeRegExp(username), 'i');
	// 	return RocketChat.models.Users.findByUsernameNameOrEmailAddressAndSiteId(UserSiteId, usernameReg, options);
	// }
};
