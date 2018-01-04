angular.module('myApp').controller('EpisodeCtrl', ['$scope', '$http', '$routeParams', '$timeout', function podcastController($scope, $http, $routeParams, $timeout) {

    $scope.pay_req_generated = false;

    $http.get('/api/podcast/' + $routeParams.podcastID + '/' + $routeParams.episodeID).then(
        function(response){
            $scope.episode = response.data.episode;
            console.log($scope.episode);
            console.log($scope.episode);
            $scope.podcast = response.data.podcast;
            console.log($scope.podcast);
            $scope.episode.unlocked = false;
            pollEpisodeLink(true);
        },
        function(error){
            console.log('Error: ' + error.data);
        });

    $scope.getPayReq = function() {
        $http.get('/api/lightning/buy/' + $scope.episode.enclosures[0]).then(
            function(response){
                console.log(response.data);
                $scope.pay_req = response.data.invoice.payment_request;
                $scope.pubkey = response.data.pubkey;
                $scope.hostname = response.data.hostname;
                $scope.pay_req_generated = true;
                $scope.price = response.data.price;
            },
            function(error){
                console.log('Error: ' + error.data);
            });
    }

    var pollEpisodeLink = function(firstTry) {
        if(!$scope.episode.enclosures){
            return;
        }
        if(firstTry | $scope.pay_req_generated){
            $http.get('/api/enclosure/' + $scope.episode.enclosures[0]).then(
                    function(response){
                        console.log(response.data);
                        $scope.episode.enclosures[0] = response.data;
                        $scope.episode.unlocked = true;
                    },
                    function(error){
                        if(error.status == 402){
                            $scope.episode.unlocked = false;
                            $timeout(pollEpisodeLink, 1000, true, false);
                        }
                        else {
                            console.log('Error: ' + error.data);
                        }
                    });
        }
        else {
            $timeout(pollEpisodeLink, 1000, true, false);

        }
    }
}]);

