angular.module('myApp').controller('EpisodeCtrl', ['$scope', '$http', '$routeParams', function podcastController($scope, $http, $routeParams) {
    $http.get('/api/podcast/' + $routeParams.podcastName + '/' + $routeParams.episodeHash).then(
        function(response){
            $scope.podcastName = $routeParams.podcastName;
            $scope.hash = $routeParams.episodeHash;
            $scope.episode = response.data;
            $scope.episode.unlocked = true;
            $scope.pay_req_generated = false;
        },
        function(error){
            if(error.status == 402){
                $scope.podcastName = $routeParams.podcastName;
                $scope.hash = $routeParams.episodeHash;
                $scope.episode = error.data;
                $scope.episode.unlocked = false;
                $scope.pay_req_generated = false;
            }
            console.log('Error: ' + error.data);
        });

    $scope.getPayReq = function() {
        $http.get('/api/lightning/buy/' + $scope.podcastName + '/' + $scope.hash).then(
            function(response){
                $scope.pay_req = response.data.pay_req;
                $scope.pubkey = response.data.pubkey;
                $scope.hostname = response.data.hostname;
                $scope.pay_req_generated = true;
            },
            function(error){
                console.log('Error: ' + error.data);
            });
    }
}
]);

