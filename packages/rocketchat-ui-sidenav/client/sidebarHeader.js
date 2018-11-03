/* globals popover menu */
const setStatus = (status) => {
	AccountBox.setStatus(status);
	RocketChat.callbacks.run('userStatusManuallySet', status);
	popover.close();
};

const viewModeIcon = {
	extended: 'th-list',
	medium: 'list',
	condensed: 'list-alt',
};

const extendedViewOption = (user) => {
	if (RocketChat.settings.get('Store_Last_Message')) {
		return {
			icon: viewModeIcon.extended,
			name: t('拡張'),
			modifier: RocketChat.getUserPreference(user, 'sidebarViewMode') === 'extended' ? 'bold' : null,
			action: () => {
				Meteor.call('saveUserPreferences', { sidebarViewMode: 'extended' }, function(error) {
					if (error) {
						return handleError(error);
					}
				});
			},
		};
	}

	return;
};


const toolbarButtons = (user) => [{
	name: t('検索'),
	icon: 'magnifier',
	action: () => {
		const toolbarEl = $('.toolbar');
		toolbarEl.css('display', 'block');
		toolbarEl.find('.rc-input__element').focus();
	},
},
{
	name: t('ディレクトリ'),
	icon: 'globe',
	action: () => {
		menu.close();
		FlowRouter.go('directory');
	},
},
{
	name: t('表示方法'),
	icon: () => viewModeIcon[RocketChat.getUserPreference(user, 'sidebarViewMode') || 'condensed'],
	action: (e) => {
		const hideAvatarSetting = RocketChat.getUserPreference(user, 'sidebarHideAvatar');
		const config = {
			columns: [
				{
					groups: [
						{
							items: [
								extendedViewOption(user),
								{
									icon: viewModeIcon.medium,
									name: t('ミディアム'),
									modifier: RocketChat.getUserPreference(user, 'sidebarViewMode') === 'medium' ? 'bold' : null,
									action: () => {
										Meteor.call('saveUserPreferences', { sidebarViewMode: 'medium' }, function(error) {
											if (error) {
												return handleError(error);
											}
										});
									},
								},
								{
									icon: viewModeIcon.condensed,
									name: t('凝縮'),
									modifier: RocketChat.getUserPreference(user, 'sidebarViewMode') === 'condensed' ? 'bold' : null,
									action: () => {
										Meteor.call('saveUserPreferences', { sidebarViewMode: 'condensed' }, function(error) {
											if (error) {
												return handleError(error);
											}
										});
									},
								},
							],
						},
						{
							items: [
								{
									icon: 'user-rounded',
									name: hideAvatarSetting ? t('Show_Avatars') : t('アバター隠す'),
									action: () => {
										Meteor.call('saveUserPreferences', { sidebarHideAvatar: !hideAvatarSetting }, function(error) {
											if (error) {
												return handleError(error);
											}
										});
									},
								},
							],
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};

		popover.open(config);
	},
},
{
	name: t('ソート'),
	icon: 'sort',
	action: (e) => {
		const options = [];
		const config = {
			template: 'sortlist',
			currentTarget: e.currentTarget,
			data: {
				options,
			},
			offsetVertical: e.currentTarget.clientHeight + 10,
		};
		popover.open(config);
	},
},
{
	name: t('新しいチャンネル作成'),
	icon: 'edit-rounded',
	condition: () => RocketChat.authz.hasAtLeastOnePermission(['create-c', 'create-p']),
	action: () => {
		menu.close();
		FlowRouter.go('create-channel');
	},
},
{
	name: t('Options'),
	icon: 'menu',
	condition: () => AccountBox.getItems().length || RocketChat.authz.hasAtLeastOnePermission(['manage-emoji', 'manage-integrations', 'manage-oauth-apps', 'manage-own-integrations', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration']),
	action: (e) => {
		let adminOption;
		if (RocketChat.authz.hasAtLeastOnePermission(['manage-emoji', 'manage-integrations', 'manage-oauth-apps', 'manage-own-integrations', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration'])) {
			adminOption = {
				icon: 'customize',
				name: t('Administration'),
				type: 'open',
				id: 'administration',
				action: () => {
					SideNav.setFlex('adminFlex');
					SideNav.openFlex();
					FlowRouter.go('admin-info');
					popover.close();
				},
			};
		}

		const config = {
			popoverClass: 'sidebar-header',
			columns: [
				{
					groups: [
						{
							items: AccountBox.getItems().map((item) => {
								let action;

								if (item.href) {
									action = () => {
										FlowRouter.go(item.href);
										popover.close();
									};
								}

								if (item.sideNav) {
									action = () => {
										SideNav.setFlex(item.sideNav);
										SideNav.openFlex();
										popover.close();
									};
								}

								return {
									icon: item.icon,
									name: t(item.name),
									type: 'open',
									id: item.name,
									href: item.href,
									sideNav: item.sideNav,
									action,
								};
							}).concat([adminOption]),
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};

		popover.open(config);
	},
}];
Template.sidebarHeader.helpers({
	myUserInfo() {
		const id = Meteor.userId();

		if (id == null && RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return {
				username: 'anonymous',
				status: 'online',
			};
		}
		return id && Meteor.users.findOne(id, { fields: {
			username: 1, status: 1,
		} });
	},
	toolbarButtons() {
		return toolbarButtons(Meteor.userId()).filter((button) => !button.condition || button.condition());
	},
});

Template.sidebarHeader.events({
	'click .js-button'(e) {
		if (document.activeElement === e.currentTarget) {
			e.currentTarget.blur();
		}
		return this.action && this.action.apply(this, [e]);
	},
	'click .sidebar__header .avatar'(e) {
		if (!(Meteor.userId() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead'))) {
			const user = Meteor.user();
			const config = {
				popoverClass: 'sidebar-header',
				columns: [
					{
						groups: [
							{
								title: t('ユーザー'),
								items: [
									{
										icon: 'circle',
										name: t('オンライン'),
										modifier: 'online',
										action: () => setStatus('online'),
									},
									{
										icon: 'circle',
										name: t('離れて'),
										modifier: 'away',
										action: () => setStatus('away'),
									},
									{
										icon: 'circle',
										name: t('忙しい'),
										modifier: 'busy',
										action: () => setStatus('busy'),
									},
									{
										icon: 'circle',
										name: t('目に見えない'),
										modifier: 'offline',
										action: () => setStatus('offline'),
									},
								],
							},
							{
								items: [
									{
										icon: 'user',
										name: t('マイアカウント'),
										type: 'open',
										id: 'account',
										action: () => {
											SideNav.setFlex('accountFlex');
											SideNav.openFlex();
											FlowRouter.go('account');
											popover.close();
										},
									},
									{
										icon: 'sign-out',
										name: t('ログアウト'),
										type: 'open',
										id: 'logout',
										action: () => {
											Meteor.logout(() => {
												RocketChat.callbacks.run('afterLogoutCleanUp', user);
												Meteor.call('logoutCleanUp', user);
												FlowRouter.go('home');
												popover.close();
											});
										},
									},
								],
							},
						],
					},
				],
				currentTarget: e.currentTarget,
				offsetVertical: e.currentTarget.clientHeight + 10,
			};

			popover.open(config);
		}
	},
});
