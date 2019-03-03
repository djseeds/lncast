angular.module('myApp').controller('LoginCtrl',
    ['$rootScope', '$scope', '$http', '$location',
      function loginController($rootScope, $scope, $http, $location) {
        $scope.loginFailed = false;
        $scope.submit = function() {
          $http.post('/login', {
            username: $scope.username,
            password: $scope.password,
          }).then(
              function(response) {
                $rootScope.activeUser = $scope.username;
                $location.path('/');
              },
              function(error) {
                $scope.loginFailed = true;
              });
        };
      },
    ]);

