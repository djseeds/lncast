angular.module('myApp').controller('LogoutCtrl',
    ['$rootScope', '$scope', '$http', '$location',
      function logoutController($rootScope, $scope, $http, $location) {
        $http.post('/logout').then(
            function(response) {
              $rootScope.activeUser = undefined;
              $location.path('/');
            },
            function(error) {
            });
      },
    ]);

