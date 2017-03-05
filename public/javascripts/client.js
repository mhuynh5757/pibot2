var NODE_SIZE = 5;

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
  
  var socket = io('/ui');
  
  var canvas = document.getElementById('map');
  var ctx = canvas.getContext('2d');
  
  socket.on('data', function(data) {
    var x_max = -Infinity;
    var x_min = Infinity;
    
    var y_max = -Infinity;
    var y_min = Infinity; 
    
    data.forEach(function(point) {
      if (x_max < point[0]) {
        x_max = point[0];
      }
      if (x_min > point[0]) {
        x_min = point[0];
      }
      if (y_max < point[1]) {
        y_max = point[1];
      }
      if (y_min > point[1]) {
        y_min = point[1];
      }
    });
    
    var x_range = x_max - x_min;
    var y_range = y_max - y_min;
    
    var normalized_data = [];
    
    data.forEach(function(point) {
      normalized_data.push(
        [(point[0] - x_min) / x_range, (point[1] - y_min) / y_range]
      );
    });
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    normalized_data.forEach(function(point) {
      var x_val = (point[0] * ctx.canvas.width) - NODE_SIZE/2
      var y_val = (point[1] * ctx.canvas.height) - NODE_SIZE/2
      ctx.fillRect(
        ctx.canvas.width - (4 * x_val / 5 + ctx.canvas.width / 5),
        ctx.canvas.height - (4 * y_val / 5 + ctx.canvas.height / 5),
        NODE_SIZE, NODE_SIZE
      );
    });
  });
  
  $scope.log = [];
  socket.on('message', function(message) {
    $scope.$apply(function() {
      $scope.log.push('ROBOT: ' + message);
    });
    var elem = document.getElementById('log');
    elem.scrollTop = elem.scrollHeight;
  });
  
  $scope.goal_x = 0;
  $scope.goal_y = 0;
  $scope.send_command = function(command) {
    if (command == 'make map') {
      socket.emit('command', {
        command: command
      });
    }
    else if (command == 'call robot') {
      socket.emit('command', { 
        command: command, goal_x: $scope.goal_x, goal_y: $scope.goal_y 
      });
    }
  }
}]);