angular.module('myApp').controller('PodcastCtrl', ['$scope', '$http', '$routeParams', function podcastController($scope, $http, $routeParams) {
    $http.get('/api/podcast/' + $routeParams.podcastName).then(
        function(response){
            $scope.podcastName = $routeParams.podcastName;
            $scope.episodes = response.data;
        },
        function(error){
            console.log('Error: ' + error);
        })
    }
]);
