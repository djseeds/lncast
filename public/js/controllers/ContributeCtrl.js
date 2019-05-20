angular.module('myApp').controller('ContributeCtrl', ['$scope',
  function contributeController($scope) {
    const numColumns = 2;

    const btcPayServerUrl = 'https://btcpayserver.lncast.com:23000';
    const storeId = '7kTatELCfT92wDjvFeg9K2Kon1XStatxK39eWya7NuPN';

    const splitArray = function(arr, step) {
      const chunks = [];
      let i = 0;
      const n = arr.length;
      while (i < n) {
        chunks.push(arr.slice(i, i += step));
      }
      return chunks;
    };

    $scope.donationItems = splitArray([
      {
        title: 'Buy me a coffee',
        amount: 3,
        message: 'The most direct way to support my future coding endeavors.' +
        ' Coffee in, code out.',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/1200px-A_small_cup_of_coffee.JPG',
        itemCode: 'coffee',
      },
      {
        title: 'Buy me a beer',
        amount: 5,
        message: 'Like what I\'m doing here with LNCast?' +
        ' Consider buying me a beer as thanks!',
        imageUrl: 'https://s3-us-west-2.amazonaws.com/brewersassoc/wp-content/uploads/2018/03/hazy-ipa-style-feature2-600x556.jpg',
        itemCode: 'beer',
      },
      {
        title: 'Buy me a steak',
        amount: 50,
        message: 'Nothing goes better with Bitcoin than beef.',
        imageUrl: 'https://d5q6n6g7.stackpathcdn.com//content/images/thumbs/0001404.jpeg',
        itemCode: 'steak',
      },
      {
        title: 'Help me stack sats',
        amount: 1,
        customAmount: true,
        // eslint-disable-next-line max-len
        message: 'Help support the development of LNCast and future projects by helping me stack sats.',
        imageUrl: 'https://news.bitcoin.com/wp-content/uploads/2017/12/dorian-nakamoto-satoshi-1200x1024.png',
        itemCode: 'steak',
      },
    ], numColumns);
    $scope.showModal = function(config) {
      BtcPayServerModal.show(
          btcPayServerUrl,
          storeId,
          {
            price: config.amount,
            currency: 'USD', itemDesc: config.itemDesc,
            itemCode: config.itemCode || 'donation',
          }
      );
    };
  }]);

