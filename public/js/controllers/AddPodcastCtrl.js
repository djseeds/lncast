angular.module('myApp').controller('AddPodcastCtrl', ['$rootScope', '$scope', '$http', '$location', function addPodcastController($rootScope, $scope, $http, $location) {
    $scope.submit = function(){
        $http.post('/api/add', {
            feed: $scope.feed,
            price: 0.01,
        }).then(
            function(response){
                $location.path(response.data.url);
            },
            function(error){
                if(error.status == 401){
                    $location.path('/login');
                }
                console.log('Error: ' + error.data);
            });
    }
}
]);

