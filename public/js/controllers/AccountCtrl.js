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

    $scope.deleteAccount = function(podcast){
        if(confirm("Are you sure you want to delete your account?\nAll of your data (including podcasts) will be deleted.")){
            $http.delete('/api/account').then(
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

    $scope.deletePodcast = function(podcast){
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
    
    $scope.update = function(podcastId, update){
        $http.post('/api/podcast/' + podcastId, data = update).then(
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
