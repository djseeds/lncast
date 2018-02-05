angular.module('myApp').controller('SubscriptionCtrl', ['$scope', '$http', '$location', function podcastController($scope, $http, $location) {
    $http.get('/api/account/subscriptions').then(
        function(response){
            $scope.podcasts = response.data;
        },
        function(error){
            if(error.status == 401){
                $location.path('/');
            }
        })
    }

    ]);
