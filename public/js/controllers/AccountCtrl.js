angular.module('myApp').controller('AccountCtrl', ['$scope', '$http', function accountController($scope, $http, $routeParams) {
    $http.get('/api/account').then(
        function(response){
            $scope.account = response.data;
        },
        function(error){
            console.log('Error: ' + error);
        })
    }
]);
