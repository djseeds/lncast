angular.module('myApp').controller('EpisodeCtrl', ['$scope', '$http', '$routeParams', '$timeout', function podcastController($scope, $http, $routeParams, $timeout) {
    $http.get('/api/podcast/' + $routeParams.podcastName + '/' + $routeParams.episodeHash).then(
        function(response){
            $scope.podcastName = $routeParams.podcastName;
            $scope.hash = $routeParams.episodeHash;
            $scope.episode = response.data;
            $scope.episode.unlocked = true;
            $scope.pay_req_generated = false;
            pollEpisodeLink();
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
    var pollEpisodeLink = function() {
        $http.get('/api/podcast/' + $routeParams.podcastName + '/' + $routeParams.episodeHash + '/link').then(
                function(response){
                    $scope.episode.link = response.data;
                    $scope.episode.unlocked = true;
                },
                function(error){
                    if(error.status == 402){
                        $scope.episode.unlocked = false;
                        $timeout(pollEpisodeLink, 1000);
                    }
                    else {
                        console.log('Error: ' + error.data);
                    }
                });
    }
}
]);

