app = angular.module('myApp', ['ngRoute', 'ngSanitize']);

app.config(function ($routeProvider) {

    $routeProvider
        // Home page
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'MainCtrl'
        })
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'LoginCtrl'
        })
        .when('/logout', {
            templateUrl: 'views/home.html',
            controller: 'LogoutCtrl'
        })
        .when('/register', {
            templateUrl: 'views/register.html',
            controller: 'RegisterCtrl'
        })
        .when('/account', {
            templateUrl: 'views/account.html',
            controller: 'AccountCtrl'
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
        .when('/add-podcast/', {
            templateUrl: 'views/addpodcast.html',
            controller: 'AddPodcastCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
});
