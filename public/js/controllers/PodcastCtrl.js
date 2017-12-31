angular.module('myApp').controller('PodcastCtrl', ['$scope', '$http', '$routeParams', function podcastController($scope, $http, $routeParams) {
    $http.get('/api/podcast/' + $routeParams.podcastID).then(
        function(response){
            $scope.podcast = response.data;
            console.log(response.data);
        },
        function(error){
            console.log('Error: ' + error);
        })
    }
]);
