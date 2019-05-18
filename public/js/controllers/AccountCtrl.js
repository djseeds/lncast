angular.module('myApp').controller('AccountCtrl',
    ['$scope', '$http', '$location', '$route',
      function accountController($scope, $http, $location, $route) {
        $http.get('/api/account').then(
            function(response) {
              $scope.account = response.data;
            },
            function(error) {
              if (error.status == 401) {
                $location.path('/login');
              } else {
                $location.path('/');
              }
            });

        $scope.deleteAccount = function(podcast) {
          const message = 'Are you sure you want to delete your account?' + '\n'
          + 'All of your data (including podcasts) will be deleted.';
          if (confirm(message)) {
            $http.delete('/api/account').then(
                function(response) {
                  $route.reload();
                },
                function(error) {
                  if (error.status == 400) {
                  // Bad request
                  } else if (error.status == 500) {
                  // Delete failed
                  }
                });
          }
        };

        $scope.deletePodcast = function(podcast) {
          if (confirm('Are you sure you want to delete your podcast?')) {
            $http.delete('/api/podcast/' + podcast._id).then(
                function(response) {
                  $route.reload();
                },
                function(error) {
                  if (error.status == 400) {
                  // Bad request
                  } else if (error.status == 500) {
                  // Delete failed
                  }
                });
          }
        };

        $scope.update = function(podcastId, update, callback) {
          $http.post('/api/podcast/' + podcastId, data = update).then(
              function(response) {
                callback(null, response.data);
              },
              function(error) {
                callback(error);
              });
        };

        $scope.addAlert = function(type, message) {
          alert = {type: type, message: message};
          if (!$scope.alerts) {
            $scope.alerts = [alert];
          } else {
            $scope.alerts.push(alert);
          }
        };

        $scope.dismissAlert = function(index) {
          if ($scope.alerts) {
            array.splice(index, 1);
          }
        };

        $scope.pairBtcPay = function(podcastData) {
          $scope.update(podcastData._id,
              {
                btcPayServer: {
                  serverUrl: podcastData.btcPayServer.serverUrl,
                  pairCode: podcastData.btcPayServer.pairCode,
                },
              },
              function(err, podcast) {
                if (err) {
                  // eslint-disable-next-line max-len
                  $scope.addAlert('danger', 'Failed to pair with BTCPayServer. Please check your values and try again.');
                } else {
                  // eslint-disable-next-line max-len
                  $scope.addAlert('success', 'Successfully paired with BTCPayServer.');
                }
              }
          );
        };

        $scope.updatePrice = function(podcastData) {
          $scope.update(podcastData._id, {price: podcastData.price},
              function(err, podcast) {
                if (err) {
                  // eslint-disable-next-line max-len
                  $scope.addAlert('danger', 'Failed to update price. Please check your values and try again.');
                } else {
                  $scope.addAlert('success', 'Successfully updated price.');
                }
              }
          );
        };

        $scope.updateStoreId = function(podcastData) {
          $scope.update(podcastData._id,
              {
                btcPayServer: {
                  storeId: podcastData.btcPayServer.storeId,
                },
              },
              function(err, podcast) {
                if (err) {
                  // eslint-disable-next-line max-len
                  $scope.addAlert('danger', 'Failed to update store ID. Please check your values and try again.');
                } else {
                  $scope.addAlert('success', 'Successfully updated store ID.');
                }
              }
          );
        };
      }]);
