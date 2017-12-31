angular.module('myApp').controller('AccountCtrl', ['$scope', '$http', function accountController($scope, $http, $routeParams) {
    $http.get('/api/account').then(
            function(response){
                $scope.account = response.data;
            },
            function(error){
                console.log('Error: ' + error);
            })
    $scope.withdraw = function(){
        $scope.invalidInvoice = false;
        $scope.paymentFailed = false;
        $http.post('/api/account/withdraw', data={payment_request: $scope.invoice}).then(
                function(response){
                    console.log(response.data);
                    $scope.account.balance = response.data.balance;
                    $scope.withdrawClicked = false;
                },
                function(error){
                    if(error.status == 400){
                        // Bad request
                        $scope.invalidInvoice = true;
                    }
                     else if(error.status == 500){
                        // Payment failed
                        $scope.paymentFailed = true;
                    }
                    console.log('Error: ' + error);
                })
    };
}]);
