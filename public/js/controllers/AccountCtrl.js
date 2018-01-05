angular.module('myApp').controller('AccountCtrl', ['$scope', '$http', '$location', function accountController($scope, $http, $location) {
    $http.get('/api/account').then(
            function(response){
                $scope.account = response.data;

            },
            function(error){
                if(error.status == 401){
                    $location.path('/login');
                }
                else{
                    $location.path('/');
                    console.log('Error: ' + error);
                }
            });

    $http.get('https://blockchain.info/ticker').then(
            function(response){
                $scope.btcPrice = response.data.USD.last;
                console.log($scope.btcPrice);
            },
            function(error){
                console.log(error);
            });
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
