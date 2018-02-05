angular.module('myApp').controller('PodcastCtrl', ['$scope', '$http', '$routeParams', '$location', function podcastController($scope, $http, $routeParams, $location) {
    $http.get('/api/podcast/' + $routeParams.podcastID).then(
            function(response){
                $scope.podcast = response.data;
                console.log(response.data);
            },
            function(error){
            })

    $scope.subscribe = function(podcast){
        $scope.subscribeFailed = false;
        $http.post('/api/subscribe', data={podcast: podcast._id}).then(
                function(response){
                    $scope.podcast.subscribed = true;
                },
                function(error){
                    if(error.status == 401){
                        $location.path('/login');
                    }
                    else {
                        $scope.subscribeFailed= true;
                    }
                })
    };

    $scope.unsubscribe = function(podcast){
        $scope.unsubscribeFailed = false;
        $http.post('/api/unsubscribe', data={podcast: podcast._id}).then(
                function(response){
                    $scope.podcast.subscribed = false;
                },
                function(error){
                    if(error.status == 401){
                        $location.path('/login');
                    }
                    else {
                        $scope.unsubscribeFailed = true;
                    }
                })
    };
}]);
