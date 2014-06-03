 'use strict';
 // Declare app level module which depends on filters, and services
 angular.module('myApp', [
     'myApp.directives',
     'myApp.controllers',
     'myApp.services',
     'imgEditor.directives'
 ]);

 angular.module('myApp.controllers', ['angularFileUpload'])
     .controller('myController', function($scope, $fileUploader, $http, $sce, transformRequestAsFormPost) {
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
             url: 'test-upload.php'
         });
         //overide the default uploader's file post to post the base 64 data
         uploader.uploadItem = function(value) {
             var index = this.getIndexOfItem(value);
             var item = this.queue[index];
             item.index = item.index || this._nextIndex++;
             item.isReady = true;

             if (this.isUploading) return;

             this.isUploading = true;
             var that = this;
             $http({
                 method: "post",
                 url: item.url,
                 transformRequest: transformRequestAsFormPost,
                 data: {
                     base64: item.base64,
                     name: item.file.name.split('.').pop()
                 }
             }).success(function(data, status, headers, config) {
                 // this callback will be called asynchronously
                 // when the response is available
                 var xhr = {
                     response: data,
                     status: status,
                     dummy: true
                 };
                 that.trigger('in:success', xhr, item, data);
                 that.trigger('in:complete', xhr, item, data);
             }).
             error(function(data, status, headers, config) {
                 alert('error');
                 console.log(data);
                 var xhr = {
                     response: data,
                     status: status,
                     dummy: true
                 };
                 that.trigger('in:error', xhr, item);
                 that.trigger('in:complete', xhr, item);
                 // called asynchronously if an error occurs
                 // or server returns response with an error status.
             });
         };

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


 <!--http://www.bennadel.com/blog/2615-posting-form-data-with-http-in-angularjs.htm -->
 // I provide a request-transformation method that is used to prepare the outgoing
 // request as a FORM post instead of a JSON packet.
 angular.module('myApp.services', []).factory(
     "transformRequestAsFormPost",
     function() {

         // I prepare the request data for the form post.
         function transformRequest(data, getHeaders) {

             var headers = getHeaders();

             headers["Content-type"] = "application/x-www-form-urlencoded; charset=utf-8";

             return (serializeData(data));

         }


         // Return the factory value.
         return (transformRequest);


         // ---
         // PRVIATE METHODS.
         // ---


         // I serialize the given Object into a key-value pair string. This
         // method expects an object and will default to the toString() method.
         // --
         // NOTE: This is an atered version of the jQuery.param() method which
         // will serialize a data collection for Form posting.
         // --
         // https://github.com/jquery/jquery/blob/master/src/serialize.js#L45
         function serializeData(data) {

             // If this is not an object, defer to native stringification.
             if (!angular.isObject(data)) {

                 return ((data == null) ? "" : data.toString());

             }

             var buffer = [];

             // Serialize each key in the object.
             for (var name in data) {

                 if (!data.hasOwnProperty(name)) {

                     continue;

                 }

                 var value = data[name];

                 buffer.push(
                     encodeURIComponent(name) +
                     "=" +
                     encodeURIComponent((value == null) ? "" : value)
                 );

             }

             // Serialize the buffer and clean it up for transportation.
             var source = buffer
                 .join("&")
                 .replace(/%20/g, "+");

             return (source);

         }

     }
 );