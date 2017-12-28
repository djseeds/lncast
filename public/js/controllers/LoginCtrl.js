angular.module('myApp').controller('LoginCtrl', ['$rootScope', '$scope', '$http', '$location', function loginController($rootScope, $scope, $http, $location) {
    $scope.submit = function(){
        console.log("sumbit");
        $http.post('/login', {
            username: $scope.username,
            password: $scope.password,
        }).then(
            function(response){
                $rootScope.activeUser = $scope.username;
                $location.path("/");
            },
            function(error){
                console.log('Error: ' + error.data);
            });
    }
}
]);

