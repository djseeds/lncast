angular.module('myApp').controller('AddPodcastCtrl', ['$rootScope', '$scope', '$http', '$location', function addPodcastController($rootScope, $scope, $http, $location) {
    $scope.price = 0.01;
    if(!$rootScope.activeUser){
        $location.path('/login');
    }
    $scope.submit = function(){
        $scope.addFailed = false;
        $http.post('/api/add', {
            feed: $scope.feed,
            price: $scope.price,
            btcPayServer: $scope.btcPayServer
        }).then(
            function(response){
                $location.path(response.data.url);
            },
            function(error){
                if(error.status == 401){
                    $location.path('/login');
                }
                else{
                    $scope.addFailed = true;
                }
            });
    }
}
]);

