(function (window, $) {
   /*
   $occurrences = inpho("/thinker/$id/occurrences.json?sep_filter=True");
   $related = inpho("/thinker/$id/related.json?sep_filter=True");
   $hyponyms = inpho("/thinker/$id/hyponyms.json?sep_filter=True");
   $influenced = inpho("/thinker/$id/influenced.json?sep_filter=True");
   */

   //global variables
   var host = "https://inpho.cogs.indiana.edu";

   var crossRef = angular.module("thinker", []);
   crossRef.controller("ThinkerCtrl", function ($scope, $http, $q) {

      $scope.currentThinkerID = "3345";
      $scope.newThinkerID = "";
       
      $scope.currentIdeaID = "2638";
      $scope.newIdeaID = ""; 
      $scope.currentIdea = []; 

      $scope.currentThinker = []; //initialize to an empty array.

      $scope.showRelatedThinker = true; //Related Thinker toggle
      $scope.showRelatedThinkerLabel = "Hide";

      $scope.showStudent = true; //Student Toggle
      $scope.showStudentLabel = "Hide";

      $scope.toggle = function (what) {

         $scope["show" + what] = !$scope["show" + what];

         if ($scope["show" + what] == true) {
            $scope["show" + what + "Label"] = "Hide";
         }
         else {
            $scope["show" + what + "Label"] = "Show";
         }
      };

      $scope.getCurrentThinker = function () {
         getThinkerService($scope, $http, $q);
      };

      $scope.getThisThinker = function (thinkerID) {
         $scope.currentThinkerID = thinkerID;
         $scope.getCurrentThinker();
      };
      
      $scope.getThisIdea = function (ideaID) {
	 $scope.currentIdeaID = ideaID; 
         console.log(ideaID); 
	 console.log(currentIdeaID); 
         $scope.getCurrentIdea(); 
      };
      $scope.getCurrentIdea = function() {
        getIdeaService($scope, $http, $q); 
      };

      $scope.getNewIdea = function (){
	  $scope.getThisIdea($scope.newIdeaID); 
      };

      $scope.getNewThinker = function () {
         $scope.getThisThinker($scope.newThinkerID);
      };
      setTimeout($scope.getCurrentThinker(), 500);
   });

   function getIdeaService(scope, http, $q){
       console.log("does it arrive?"); 
       http({ method: 'GET', url: host + "/idea/" + scope.currentIdeaID + ".json" }).
   
         success(function (data, status, headers, config) {
            scope.currentIdea = data;
	    console.log(scope.currentIdea); 
         }).
         error(function (data, status, headers, config) {
            alert("Error:" + status);
         });
}

   function getThinkerService(scope, http, $q) { //retrieve one thinker at a time using http service provided by AngularJS.  Recommend to stick with AngularJS

      http({ method: 'GET', url: host + "/thinker/" + scope.currentThinkerID + ".json" }).
         success(function (data, status, headers, config) {
            scope.currentThinker = data;
         }).
         error(function (data, status, headers, config) {
            alert("Error:" + status);
         });
   }
})(window, jQuery);
