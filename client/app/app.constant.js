(function(angular, undefined) {
  angular.module("nodeOauth2ServerExampleApp.constants", [])

.constant("appConfig", {
	"userRoles": [
		"guest",
		"user",
		"admin"
	]
})

;
})(angular);