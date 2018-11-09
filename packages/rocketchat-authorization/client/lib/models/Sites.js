RocketChat.models.Sites = new Mongo.Collection('rocketchat_registered_sites');

Object.assign(RocketChat.models.Sites, {
    findById(siteId) {
         return this.findOne({_id:siteId});
        // const roleScope = (role && role.scope) || 'Users';
        // const model = RocketChat.models[roleScope];
        // return model && model.findUsersInRoles && model.findUsersInRoles(name, scope, options);
    },
    //
    // isUserInRoles(userId, roles, scope) {
    //     roles = [].concat(roles);
    //     return roles.some((roleName) => {
    //         const role = this.findOne(roleName);
    //         const roleScope = (role && role.scope) || 'Users';
    //         const model = RocketChat.models[roleScope];
    //         return model && model.isUserInRole && model.isUserInRole(userId, roleName, scope);
    //     });
    // },
});
