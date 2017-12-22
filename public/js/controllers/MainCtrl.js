angular.module('myApp').controller('MainCtrl', ['$scope', '$http', '$routeParams', function podcastController($scope, $http, $routeParams) {
    $http.get('/api/podcasts').then(
        function(response){
            $scope.podcasts = response.data;
        },
        function(error){
            console.log('Error: ' + error);
        })
    }
]);
