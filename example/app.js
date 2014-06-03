 'use strict';
 // Declare app level module which depends on filters, and services
 angular.module('myApp', [
     'myApp.directives',
     'myApp.controllers',
     'imgEditor.directives'
 ]);

 angular.module('myApp.controllers', ['angularFileUpload'])
     .controller('myController', function($scope, $fileUploader, $http, $sce) {
         $scope.uploads = [{
             'url': 'https://scontent-a-iad.xx.fbcdn.net/hphotos-prn2/t1.0-9/1151081_10201852161326618_2087299939_n.jpg',
             'name': 'Test From Server',
         }, {
             'url': 'https://scontent-b-iad.xx.fbcdn.net/hphotos-frc3/t31.0-8/416754_3799985799085_1769166011_o.jpg',
             'name': 'Test Crop',
             'crop': {
                 'x': 0,
                 'y': 286,
                 'x2': 2046,
                 'y2': 971
             }
         }, {
             'url': 'https://fbcdn-sphotos-a-a.akamaihd.net/hphotos-ak-ash3/t1.0-9/221754_2045126368696_101105_n.jpg',
             'name': 'Test Rotate',
             'rotation': 180
         }, {
             'url': 'https://fbcdn-sphotos-a-a.akamaihd.net/hphotos-ak-ash2/t31.0-8/738229_10200191249604863_465734781_o.jpg',
             'name': 'Test Crop and Rotate',
             'crop': {
                 'x': 400,
                 'y': 9,
                 'x2': 821,
                 'y2': 667
             },
             'rotation': 90
         }, ];


         /* BEGIN: angular file uploader controller*/
         // Creates a uploader
         var uploader = $scope.uploader = $fileUploader.create({
             scope: $scope,
             url: '/test-upload.php'
         });



         // ADDING FILTERS

         // Images only
         uploader.filters.push(function(item /*{File|HTMLInputElement}*/ ) {
             var type = uploader.isHTML5 ? item.type : '/' + item.value.slice(item.value.lastIndexOf('.') + 1);
             type = '|' + type.toLowerCase().slice(type.lastIndexOf('/') + 1) + '|';
             return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
         });


         // REGISTER HANDLERS
         uploader.bind('afteraddingfile', function(event, item) {
             console.info('After adding a file', item);
         });

         uploader.bind('whenaddingfilefailed', function(event, item) {
             console.info('When adding a file failed', item);
         });

         uploader.bind('afteraddingall', function(event, items) {
             console.info('After adding all files', items);
         });

         uploader.bind('beforeupload', function(event, item) {
             console.info('Before upload', item);
         });

         uploader.bind('progress', function(event, item, progress) {
             console.info('Progress: ' + progress, item);
         });

         uploader.bind('success', function(event, xhr, item, response) {
             console.info('Success', xhr, item, response);
         });

         uploader.bind('cancel', function(event, xhr, item) {
             console.info('Cancel', xhr, item);
         });

         uploader.bind('error', function(event, xhr, item, response) {
             console.info('Error', xhr, item, response);
         });

         uploader.bind('complete', function(event, xhr, item, response) {
             console.info('Complete', xhr, item, response);
         });

         uploader.bind('progressall', function(event, progress) {
             console.info('Total progress: ' + progress);
         });

         uploader.bind('completeall', function(event, items) {
             console.info('Complete all', items);
         });

         /* END: angular file uploader controller*/

         /* BEGIN: custom controller*/


     });

 /**
  * The ng-thumb directive
  * @author: nerv
  * @version: 0.1.2, 2014-01-09
  */
 angular.module('myApp.directives', [])
     .directive('ngThumb', ['$window',
         function($window) {
             var helper = {
                 support: !! ($window.FileReader && $window.CanvasRenderingContext2D),
                 isFile: function(item) {
                     return angular.isObject(item) && item instanceof $window.File;

                 },
                 isImage: function(file) {
                     var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
                     return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
                 }
             };
             return {
                 restrict: 'A',
                 template: '<canvas/>',
                 link: function(scope, element, attributes) {
                     if (!helper.support) return;

                     var params = scope.$eval(attributes.ngThumb);

                     if (!helper.isFile(params.file)) return;
                     if (!helper.isImage(params.file)) return;

                     var canvas = element.find('canvas');
                     var reader = new FileReader();

                     reader.onload = onLoadFile;
                     reader.readAsDataURL(params.file);

                     function onLoadFile(event) {
                         var img = scope.img = new Image();
                         img.onload = onLoadImage;
                         img.src = event.target.result;
                     }

                     function onLoadImage() {
                         var width = params.width || this.width / this.height * params.height;
                         var height = params.height || this.height / this.width * params.width;
                         canvas.attr({
                             width: width,
                             height: height
                         });
                         canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
                     }
                 }
             };
         }
     ]);