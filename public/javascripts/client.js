angular.module('pibot2', ['ui.router'])

.config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
function($stateProvider, $urlRouterProvider, $locationProvider) {
  $locationProvider.html5Mode(true);
  $urlRouterProvider.otherwise('/login');
  $stateProvider
  .state('login', {
    url: '/login',
    templateUrl: '/views/login',
    controller: 'loginController'
  })
  .state('signup', {
    url: '/signup',
    templateUrl: '/views/signup',
    controller: 'signupController'
  })
  .state('home', {
    url: '/home',
    templateUrl: '/views/home',
    controller: 'homeController'
  });
}])

.controller('loginController', ['$scope', '$http', '$state',
function($scope, $http, $state) {
  $http.post('/authenticated')
  .then(function(data) {
    if (data.data) {
      $state.go('home')
    }
  });
  
  $scope.postLogin = function() {
    $http.post('/login', $scope.loginForm)
    .then(function() { // success
      $state.go('home');
    }, function() { // fail
      // some error about logins here
    });
  };
}])

.controller('signupController', ['$scope', '$http', '$state',
function($scope, $http, $state) {
  $scope.postSignup = function() {
    $http.post('/signup', $scope.signupForm)
    .then(function() { // success
      $state.go('login');
    }, function() { // fail
      // some error about signups here
    });
  }
}])

.controller('homeController', ['$scope', '$http', '$state',
function($scope, $http, $state) {
  $http.post('/authenticated')
  .then(function(data) {
    if(!data.data) {
      $state.go('login');
    }
  });
  
  $scope.logout = function() {
    $http.post('/logout')
    .then(function() { // success
      $state.go('login');
    }, function() { // fail
      // some error about not being able to log out here
    });
  }
  
  $scope.message_to_send = ''
  $scope.startup = function() {
    console.log($scope.message_to_send);
    socket.emit('startup', $scope.message_to_send);
  }
  
  var socket = io('/ui');
  
  $scope.data = [];
  socket.on('data', function(data) {
    console.log(data);
    $scope.$apply(function() {
      $scope.data = data;
    });
  });
}]);