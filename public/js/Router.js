app = angular.module('myApp', ['ngRoute', 'ngSanitize']);

app.filter('encodeURIComponent', function($window) {
    return function(x) {
        console.log("encodeURIComponent")
        console.log(x);
        console.log($window.encodeURIComponent(x));
        return $window.encodeURIComponent(x);
    }
        //return $window.encodeURIComponent;

});

app.config(function ($routeProvider) {

    $routeProvider
        // Home page
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'MainCtrl'
        })
        //Podcast page
        .when('/podcast/:podcastName', {
            templateUrl: 'views/podcast.html',
            controller: 'PodcastCtrl'
        })
        .when('/podcast/:podcastName/:episodeHash', {
            templateUrl: 'views/episode.html',
            controller: 'EpisodeCtrl'
        })
        .otherwise({
            redirect: '/'
        });
});
