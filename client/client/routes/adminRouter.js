FlowRouter.route('/admin/users', {
	name: 'admin-users',
	action() {
		BlazeLayout.render('main', { center: 'adminUsers' });
	},
});
FlowRouter.route('/admin/sites', {
	name: 'admin-sites',
	action() {
		BlazeLayout.render('main', { center: 'adminSites' });
	},
});
FlowRouter.route('/admin/siteKeys', {
    name: 'admin-siteKeys',
    action() {
        BlazeLayout.render('main', { center: 'adminSiteKeys' });
    },
});
FlowRouter.route('/admin/kpi', {
    name: 'admin-kpi',
    action() {
        BlazeLayout.render('main', { center: 'adminKpi' });
    },
});
FlowRouter.route('/admin/reports', {
    name: 'admin-reports',
    action() {
        BlazeLayout.render('main', { center: 'adminReports' });
    },
});
FlowRouter.route('/admin/rooms', {
	name: 'admin-rooms',
	action() {
		BlazeLayout.render('main', { center: 'adminRooms' });
	},
});

FlowRouter.route('/admin/info', {
	name: 'admin-info',
	action() {
		BlazeLayout.render('main', { center: 'adminInfo' });
	},
});

FlowRouter.route('/admin/import', {
	name: 'admin-import',
	action() {
		BlazeLayout.render('main', { center: 'adminImport' });
	},
});

FlowRouter.route('/admin/import/prepare/:importer', {
	name: 'admin-import-prepare',
	action() {
		BlazeLayout.render('main', { center: 'adminImportPrepare' });
	},
});

FlowRouter.route('/admin/import/progress/:importer', {
	name: 'admin-import-progress',
	action() {
		BlazeLayout.render('main', { center: 'adminImportProgress' });
	},
});

FlowRouter.route('/admin/:group?', {
	name: 'admin',
	action() {
		BlazeLayout.render('main', { center: 'admin' });
	},
});
