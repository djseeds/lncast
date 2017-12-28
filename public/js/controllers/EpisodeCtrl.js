angular.module('myApp').controller('EpisodeCtrl', ['$scope', '$http', '$routeParams', '$timeout', function podcastController($scope, $http, $routeParams, $timeout) {

    $scope.pay_req_generated = false;

    $http.get('/api/podcast/' + $routeParams.podcastID + '/' + $routeParams.episodeID).then(
        function(response){
            $scope.episode = response.data.episode;
            $scope.podcast = response.data.podcast;
            $scope.episode.unlocked = false;
        },
        function(error){
            console.log('Error: ' + error.data);
        });

    $scope.getPayReq = function() {
        $http.get('/api/lightning/buy/' + $routeParams.podcastID + '/' + $routeParams.episodeID).then(
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
        $http.get('/api/podcast/' + $routeParams.podcastID + '/' + $routeParams.episodeID + '/link').then(
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
    pollEpisodeLink();
}
]);

