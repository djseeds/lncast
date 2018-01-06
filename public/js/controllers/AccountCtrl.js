angular.module('myApp').controller('AccountCtrl', ['$scope', '$http', '$location', '$route', function accountController($scope, $http, $location, $route) {
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
                }
            });

    $http.get('https://blockchain.info/ticker').then(
            function(response){
                $scope.btcPrice = response.data.USD.last;
            },
            function(error){
            });
    $scope.withdraw = function(){
        $scope.invalidInvoice = false;
        $scope.paymentFailed = false;
        $http.post('/api/account/withdraw', data={payment_request: $scope.invoice}).then(
                function(response){
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
                })
    };

    $scope.delete = function(podcast){
        if(confirm("Are you sure you want to delete your podcast?")){
            $http.delete('/api/podcast/' + podcast._id).then(
                    function(response){
                        $route.reload();
                    },
                    function(error){
                        if(error.status == 400){
                            // Bad request
                        }
                        else if(error.status == 500){
                            // Delete failed
                        }
                    })
        }
    };
    
    $scope.update = function(podcast){
        $http.post('/api/podcast/' + podcast._id, data={price: podcast.price}).then(
                function(response){
                    $route.reload();
                },
                function(error){
                    if(error.status == 400){
                        // Bad request
                    }
                    else if(error.status == 500){
                        // Update failed
                    }
                })
    };
}]);
