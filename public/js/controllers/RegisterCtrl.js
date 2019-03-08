angular.module('myApp').controller('RegisterCtrl',
    ['$rootScope', '$scope', '$http', '$location',
      function loginController($rootScope, $scope, $http, $location) {
        $scope.registerFailed = false;
        $scope.submit = function() {
          $http.post('/api/account/register', {
            username: $scope.username,
            password: $scope.password,
          }).then(
              function(response) {
                $rootScope.activeUser = $scope.username;
                $location.path('/');
              },
              function(error) {
                $scope.registerFailed = true;
              });
        };
      },
    ]);

