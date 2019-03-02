angular.module('myApp').controller('EpisodeCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$timeout', function podcastController($scope, $rootScope, $http, $routeParams, $timeout) {

    $scope.pay_req_generated = false;
    var timeout = null;
    $scope.$on("$destroy", function(){
        if(timeout != null) {
            $timeout.cancel(timeout);
        }
    });

    $scope.pollEpisodeLink = function (repeat) {
        if (!$scope.episode.enclosure) {
            return;
        }
        $http.get('/api/enclosure/' + $scope.episode.enclosure).then(
            function (response) {
                $scope.episode.enclosure = response.data;
                $scope.episode.unlocked = true;
            },
            function (error) {
                console.log(error.data);
                if (error.status == 402) {
                    $scope.episode.unlocked = false;
                    $scope.invoice = error.data;
                    if (repeat) {
                        $scope.pay_req_generated = true;
                        timeout = $timeout($scope.pollEpisodeLink, 1000, false, true);
                    }
                }
            });
    }

    $http.get('/api/podcast/' + $routeParams.podcastID + '/' + $routeParams.episodeID).then(
        function (response) {
            $scope.episode = response.data.episode;
            $scope.podcast = response.data.podcast;
            $rootScope.meta = {
                title: $scope.episode.title,
                description: $scope.episode.description,
                image: $scope.podcast.image.url,
            }
            $scope.episode.unlocked = false;
            // Check if we have enclosure or not.
            $scope.pollEpisodeLink(false);
        },
        function (error) {
            console.log(error.data);
        });

}]);

