app = angular.module('myApp', ['ngRoute', 'ngSanitize']);

app.config(function ($routeProvider) {

    $routeProvider
        // Home page
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'MainCtrl'
        })
        .when('/login', {
            templateUrl: 'views/login.html'
        })
        .when('/purchased', {
            templateUrl: 'views/podcasts.html',
            controller: 'PurchasedCtrl'
        })
        //Podcast page
        .when('/podcast/:podcastID', {
            templateUrl: 'views/podcast.html',
            controller: 'PodcastCtrl'
        })
        .when('/podcast/:podcastID/:episodeID', {
            templateUrl: 'views/episode.html',
            controller: 'EpisodeCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
});
