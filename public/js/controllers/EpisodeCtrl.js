angular.module('myApp').controller('EpisodeCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$timeout', function podcastController($scope, $rootScope, $http, $routeParams, $timeout) {

    $scope.pay_req_generated = false;

    $http.get('/api/podcast/' + $routeParams.podcastID + '/' + $routeParams.episodeID).then(
        function(response){
            $scope.episode = response.data.episode;
            $scope.podcast = response.data.podcast;
            $rootScope.meta = {
                title: $scope.episode.title,
                description: $scope.episode.description,
                image: $scope.podcast.image.url,
            }
            $scope.episode.unlocked = false;
            // Check if we have enclosure or not.
            $http.get('/api/enclosure/' + $scope.episode.enclosure).then(
                function (response) {
                    console.log(response.data);
                    $scope.pay_req = response.data.invoice.payment_request;
                    $scope.price = response.data.price;
                    $scope.episode.unlocked = true;
                },
                function (error) {
                    console.log(error.data)
                    if (error.status == 402) {
                        $scope.episode.unlocked = false;
                        $scope.pay_req = response.data.url;
                        $scope.pay_req_generated = true;
                    }
                });
        },
        function (error) {
        });


    $scope.pollEpisodeLink = function () {
        if (!$scope.episode.enclosure) {
            return;
        }
        $http.get('/api/enclosure/' + $scope.episode.enclosure).then(
            function (response) {
                console.log(response.data)
                $scope.episode.unlocked = true;
            },
            function (error) {
                console.log(error.data)
                if (error.status == 402) {
                    $scope.episode.unlocked = false;
                    $scope.pay_req = response.data.url;
                    $timeout(pollEpisodeLink, 1000, true, false);
                }
            });
    }
}]);

